---
title: Leveling Up Your .Net Testing Patterns - Part II
date: "2019-03-16T00:00:00.000Z"
---

# THINGS TO DO:

* Demo transactional testing using ADO.Net directly
* Discuss general test cleanup (using IDisposable)
* Consider providing another example (e.g. Service Bus)

In part 1 of this blog, I introduced factories and showed how to generate fake data to
introduce some randomness to our tests and improve the coverage of possible input
parameters. In part 2, we'll be moving on to integration testing.

If you're very familiar with OWIN or ASP.Net Core, you've probably read about (or written)
integration tests that use an in-memory web server. But, I will very quickly go over an introduction
for anyone who is unfamiliar with the tools that are now available.

ASP.Net Core has a set of APIs that you can use – available in the `Microsoft.AspNetCore.TestHost` package –
to create an in memory web server that you can issue HTTP requests against.
This is a fantastic way to write end-to-end application tests.
A simple test might look something like:

```csharp
[Fact]
public async Task async Can_Get_Articles()
{
    // arrange
    var expectedArticles = _faker.Random.Int(0, 10);
    var articles = ArticleFactory.Get(expectedArticles);
    DbContext.Articles.AddRange(articles);
    await DbContext.SaveChangesAsync();

    const string route = $"api/v1/articles";

    // act
    var response = await Client.GetAsync(route);

    // assert
    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    // ...
    Assert.Equal(expectedArticles, deserializedArticles.Count);
}
```

However, the problem with the above test is that it assumes the database is empty.
If you are sharing a `DbContext` with other tests or even if there are other tests
which may be concurrently accessing the database, this is unlikely to be true.
Or at least, there is the possibility that other tests might occasionally invalidate
that assumption causing the test to act "flaky".

So, what are some of our options to mitigate flaky tests? One naive option is to force
serial execution of the tests and make sure each test cleans up after itself. Generally,
to avoid a lot of cleanup code, a test fixture may just drop and re-create the database on
every run. However, as your number of tests increases, this will get painfully slow
even if your tests are run asynchronously from your development workflow via a build server.
Also, this encourages the poor habit of not running tests locally.

The first alternative to consider is using the `Microsoft.EntityFrameworkCore.InMemory` package
for running your database. This is a perfectly fine option. You just need to be aware that it limits
the scope of what is actually being tested. Some of these limitations have been
[enumerated in the docs](https://docs.microsoft.com/en-us/ef/core/miscellaneous/testing/in-memory).

> * InMemory will allow you to save data that would violate referential integrity constraints in a relational database.
>
> * If you use DefaultValueSql(string) for a property in your model, this is a relational database API and will have no effect when running against InMemory.

In addition to these limitations, you may run into issues if your models depend on provider specific
data types or constraints. For example, a PostgreSQL specific column type, will not be handled by the
in memory provider and is unlikely to expose data type related issues.
As an example, I might make the mistake of defining my model like so:

```csharp
[Column(TypeName = "int2")]
public int Ordinal { get; set; }
```

I have defined a column type of `int2` (16 bit integer) but declared the .Net type to be `int` (32 bit integer).
The in-memory provider will be unable to detect this problem.

# TODO: test the example

The alternative that I would like to propose is transactional testing.
Transactional tests are tests that get wrapped in a database transaction and are rolled back when the test completes.
We can run our tests in an isolated [Entity Framework transaction](https://docs.microsoft.com/en-us/ef/core/saving/transactions).
A simple transaction might look like:

```csharp
using (var transaction = _dbContext.Database.BeginTransaction())
{
    try
    {
        // do some work that requires calling SaveChanges multiple times...

        transaction.Commit();
    }
    catch (Exception)
    {
        transaction.Rollback();
    }
}
```

The call to [`BeginTransaction`](https://github.com/aspnet/EntityFrameworkCore/blob/1d2178f38d231599b53f899af498107fc1db39d9/src/EFCore.Relational/Storage/RelationalConnection.cs#L246) will begin an [ADO.NET transaction](https://docs.microsoft.com/en-us/dotnet/framework/data/adonet/local-transactions)
and subsequent calls to `SaveChanges` will use the open transaction. When the `DbContext` is disposed it will rollback the transaction if it has not already been committed.

Wrapping integration tests in transactions is not a new concept and it comes out-of-the-box [in Rails](https://github.com/rails/rails/commit/903ef71b9952f4bfaef798bbd93a972fc25010ad).
However, since .Net is much less opinionated than rails, it's not reasonable to expect this to be a built-in feature.
So, how can we achieve this using Entity Framework Core and ASP.Net Core?

Let's take a look at the simplest use of transactions in integration tests.
We're going to test that an `ArticleService` persists data to the database:

```csharp
public async Task CreateAsync_Persists_Article()
{
    using (var transaction = _dbContext.Database.BeginTransaction())
    {
        try
        {
            // arrange
            var article = ArticleFactory.Get();
            var service = new ArticleService(_dbContext);

            // act
            await service.CreateAsync(article); // will call _dbContext.SaveChanges();

            // assert
            var dbArticle = await _dbContext.SingleOrDefaultAsync(a => a.UniqueId == article.UniqueId);
            Assert.NotNull(dbArticle);
        }
        catch (Exception)
        {
            transaction.Rollback();
        }
    }
}
```

By using the transaction, we can ensure that the changes to the `DbContext` are rolled back after the change. In addition,
SQLServer, PostgreSQL and Oracle 11g all use
[Read Committed isolation](https://www.postgresql.org/docs/9.5/static/transaction-iso.html)
by default. What this means is that the changes within this transaction will not be visible to other concurrent transactions.

Things get a little more interesting when we decide to run end to end tests with an in memory web server.
To do this let's define a test fixture to centralize our work.
I'm going to be using xUnit, but this should be possible with any of the major testing frameworks.

In this case the fixture is simply a shared base class that each test class will inherit.
Because of this, each test will get a new instance. An example fixture is defined below:

```csharp
public class TestFixture<TStartup> : IDisposable where TStartup : class
{
    private readonly TestServer _server;
    private readonly IServiceProvider _services;
    private readonly IDbContextTransaction _transaction;

    public TestFixture()
    {
        // create our in-memory web server and the client that we will
        // use to send requests
        var builder = new WebHostBuilder().UseStartup<TStartup>();
        _server = new TestServer(builder);
        _services = _server.Host.Services;
        Client = _server.CreateClient();

        // get the DbContext from the registered services
        DbContext = GetService<AppDbContext>();
        DbContext.Database.EnsureCreated();

        // begin the transaction
        _transaction = DbContext.Database.BeginTransaction();
    }

    protected HttpClient Client { get; set; }
    protected AppDbContext DbContext { get; private set; }
    protected T GetService<T>() => (T)_services.GetService(typeof(T));

    // when the test is done running xUnit will dispose of the
    // fixture  (calling this method), at this point we can rollback
    // the transaction
    public void Dispose()
    {
        if (Transaction != null)
        {
            _transaction.Rollback();
            _transaction.Dispose();
        }
    }
}
```

With the above fixture, we can define our previous test example like so:

```csharp
public class Article_Tests : TestFixture<Startup>
{
    [Fact]
    public async Task async Can_Get_Articles()
    {
        // arrange
        var expectedArticles = _faker.Random.Int(0, 10);
        var articles = ArticleFactory.Get(expectedArticles);
        DbContext.Articles.AddRange(articles);
        await DbContext.SaveChangesAsync();

        const string route = $"api/v1/articles";

        // act
        var response = await Client.GetAsync(route);

        // assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        // ...
        Assert.Equal(expectedArticles, deserializedArticles.Count);
    }
}
```

However, we're going to have a problem because if you have properly defined the
`AppDbContext` DI registration scope as `Scoped`, then the instance that is accessed
by the test will be different than the instance used by the web server and they will not
share a transaction scope. In other words, the web server will return an empty set because
it is unaware of the transaction running in the test. So, we can create a new `TestStartup`
class that registers the `AppDbContext` as a singleton. Remember, that this is not an implementation
of a traditional [singleton pattern in C#](http://csharpindepth.com/Articles/General/Singleton.aspx),
but instead just means that any lookups on the **same container instance**
will receive the same **service instance**. This means transaction isolation is preserved between tests
as long as tests do not share a `TestServer` instance.

```csharp
services.AddSingleton<DbContext, AppDbContext>();
```

We can make one further improvement to speed up our tests and that is to use a shared collection
so that we only have to run `DbContext.Database.EnsureCreated()` once. The benefit here may be minor
but will ad up as your test count grows. In xUnit, we'll define a `CollectionDefinition`
which allows a fixture instance to be shared across tests. The collection definition would look like:

```csharp
[CollectionDefinition(nameof(DatabaseCollection))]
public class DatabaseCollection : ICollectionFixture<DatabaseFixture>>
{ }

public class DatabaseFixture
{
    static DatabaseFixture()
    {
        // use the database factory to get the database
        // and ensure it has been created
        DbContext.Database.EnsureCreated();
    }
}

[Collection(nameof(DatabaseCollection))]
public class Article_Tests : TestFixture<Startup> { /* ... */}
```

## Summary
