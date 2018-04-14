---
title: Leveling Up Your .Net Testing Patterns - Part II Transactional Integration Testing
date: "2018-04-14T00:00:00.000Z"
description: Increase performance, reduce boilerplate, and improve DX through transactional integration testing. Working examples included.
---

In [part 1](http://nance.io/leveling-up-your-dotnet-testing/) of this blog post, I introduced a few testing patterns.
Specifically I showed how you can use factories to generate fake data and create randomness in our tests.
This can improve the coverage of possible input parameters and possibly expose unexpected application bugs.

In this post we'll be moving on to integration testing.
I'll show a few options for making our integration tests idempotent even in the face of concurrent execution.
Almost all of the examples below will be using [Entity Framework Core](https://github.com/aspnet/EntityFrameworkCore).
At the end I'll quickly show how the same principles can be applied using any data access layer that provides
`IDbTransaction` capabilities, such as [Dapper](https://github.com/StackExchange/Dapper).

I'll be using [xUnit](https://xunit.github.io/) for the testing framework.
However, you should be able to do these same things with other frameworks by using the APIs they provide to share test between tests.

<center><a href="https://github.com/jaredcnance/TransactionalTests" target="_blank">Skip to the example repo</a></center>

An integration test is one that tests multiple layers of our application, often times extending all the way to the data persistence layer.
The following is an example of an integration test that verifies an `ArticleService` can fetch all articles from the database.
To do this, we need to first create some articles to query.

```csharp
[Fact]
public async Task GetAllAsync_Returns_All_Articles()
{
    // arrange
    var expectedArticleCount = _faker.Random.Int(5, 15);
    var expectedArticles = ArticleFactory.Create(expectedArticleCount);
    DbContext.Articles.AddRange(expectedArticles);
    await DbContext.SaveChangesAsync();

    var service = new ArticleService(DbContext);

    // act
    var actualArticles = await service.GetAllAsync();

    // assert
    Assert.Equal(expectedArticleCount, actualArticles.Count);
}
```

The problem with this test is that it **assumes the database is empty**.
If there are other tests concurrently accessing the database, this is unlikely to be true.
At a minimum, there is the possibility that other tests might occasionally invalidate
that assumption causing the test to act "flaky".

## Option 1: Serial Execution

One naïve option is to force serial execution of the tests and make sure each test cleans up after itself.
Generally, to avoid a lot of cleanup code, a test fixture may just drop and re-create the database on
every run. However, as your number of tests increases, this will get painfully slow
even if your tests are run asynchronously from your development workflow via a build server.
Also, this encourages the poor habit of not running tests locally.

## Option 2: In Memory Databases

If you're using Entity Framework, a good option is using the `Microsoft.EntityFrameworkCore.InMemory`
package for running your database. You just need to be aware that it limits
the scope of what is actually being tested. Some of these limitations have been
[enumerated in the docs](https://docs.microsoft.com/en-us/ef/core/miscellaneous/testing/in-memory).

> * InMemory will allow you to save data that would violate referential integrity constraints in a relational database.
>
> * If you use DefaultValueSql(string) for a property in your model, this is a relational database API and will have no effect when running against InMemory.

In addition to these limitations, you may run into issues if your models depend on provider specific data types or constraints.
For example, a PostgreSQL specific column type, will not be handled by the in memory provider and is unlikely to expose data type related issues.
Consider the following model property:

```csharp
[Column(TypeName = "int2")]
public int Ordinal { get; set; }
```

I have defined a column type of `int2` (16 bit integer) but declared the .Net type to be `int` (32 bit integer).
The in-memory provider will be unable to detect truncation issues since it has no way to determine what `int2` means.
So, your tests may pass, but you are at risk for hitting errors such as this one in production:

```
 Microsoft.EntityFrameworkCore.DbUpdateException : An error occurred while updating the entries. See the inner exception for details.
---- System.OverflowException : Value was either too large or too small for an Int16.
```

Other limitations include the lack of support for relational APIs such as migrations and transactions.

## Option 3: Transactional Testing

The alternative that I would like to propose is transactional testing.
Transactional tests are tests that get wrapped in a database transaction and are rolled back when the test completes.
We can run our tests in an isolated [Entity Framework transaction](https://docs.microsoft.com/en-us/ef/core/saving/transactions).
An example transaction might look like:

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

The call to [`BeginTransaction`](https://github.com/aspnet/EntityFrameworkCore/blob/1d2178f38d231599b53f899af498107fc1db39d9/src/EFCore.Relational/Storage/RelationalConnection.cs#L246)
will begin an [ADO.NET transaction](https://docs.microsoft.com/en-us/dotnet/framework/data/adonet/local-transactions)
and subsequent calls to `SaveChanges` will use the open transaction.
When the `DbContext` is disposed it will rollback the transaction if it has not already been committed.

Wrapping integration tests in transactions is not a new concept and it comes out-of-the-box [in Rails](https://github.com/rails/rails/commit/903ef71b9952f4bfaef798bbd93a972fc25010ad),
[Phoenix](https://hexdocs.pm/phoenix/testing.html) and I'm sure other frameworks as well.
However, since .Net is much less opinionated than these frameworks, it's not reasonable to expect this to be a built-in feature (yet :fingers_crossed:).

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
            var dbArticle = await _dbContext.Articles.Single();
            Assert.NotNull(dbArticle);
        }
        finally
        {
            transaction.Rollback();
        }
    }
}
```

By using the transaction, we can ensure that the changes to the `DbContext` are rolled back upon test completion.
SQLServer, PostgreSQL and Oracle 11g all use
[Read Committed isolation](https://www.postgresql.org/docs/9.5/static/transaction-iso.html) by default.
What this means is that the changes within this transaction will not be visible to other concurrent transactions.

## Fixtures

At this point, we have a strategy testing our database-dependent services without having to mock the database provider.
However, it would be pretty annoying if we had to wrap all our tests in this transactional boilerplate.

**Enter fixtures**

We can use fixtures to get the boilerplate out of the way.
In xUnit, fixtures can be created through inheritance since each test is run using a new instance of the test class.
Here is an example where we create a transaction in an inherited fixture that implements `IDisposable`.

```csharp
public class DbContextFixture : IDisposable
{
    protected IDbContextTransaction Transaction { get; }
    protected AppDbContext DbContext { get; }

    public DbContextFixture()
    {
        // configure our database
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(/* ... */)
            .Options;

        DbContext = new AppDbContext(options);

        // begin the transaction
        Transaction = DbContext.Database.BeginTransaction();
    }

    public void Dispose()
    {
        if (Transaction != null)
        {
            Transaction.Rollback();
            Transaction.Dispose();
        }
    }
}

public class TestClass : DbContextFixture { /* ... */ }
```

When our test gets disposed, the transaction will be rolled back.

## Transactions Using ASP.Net Core TestServer

Things get a little more interesting when we decide to run end-to-end tests.
ASP.Net Core has a set of APIs that you can use – available in the `Microsoft.AspNetCore.TestHost` package –
to create an in memory web server.
This allows you to validate your entire web application (serializers, routing, controllers, services, etc.) in your tests.
This is a fantastic way to write E2E application tests.

An example fixture for web services might look like:

```csharp
public class WebFixture<TStartup> : IDisposable where TStartup : class
{
    private readonly TestServer _server;
    private readonly IServiceProvider _services;
    private readonly IDbContextTransaction _transaction;

    protected readonly HttpClient Client;
    protected AppDbContext DbContext { get; }

    public WebFixture()
    {
        var builder = WebHost.CreateDefaultBuilder()
            .UseStartup<TStartup>();

        // construct the test server and client we'll use to
        // send requests
        _server = new TestServer(builder);
        Client = _server.CreateClient();
        _services = _server.Host.Services;

        // resolve a DbContext instance from the container
        // and begin a transaction on the context.
        DbContext = GetService<AppDbContext>();
        _transaction = DbContext.Database.BeginTransaction();
    }

    protected T GetService<T>() => (T)_services.GetService(typeof(T));

    public void Dispose()
    {
        if (_transaction != null)
        {
            _transaction.Rollback();
            _transaction.Dispose();
        }
    }
}
```

And then our test can use the fixture to send requests to the server.

```csharp
public class Articles_Tests : WebFixture<TestStartup>
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

        // Generally, I prefer checking the status code first,
        // since an error response may result in an exception during/after
        // de-serialization. Knowing the returned status code is more helpful
        // than an ambiguous exception thrown after failed de-serialization
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // I like to move de-serialization into the fixture since the process
        // doesn't change much and is just boilerplate.
        // DeserializeAsync<T> might look like:
        //
        // var json = await response.Content.ReadAsStringAsync();
        // return JsonConvert.DeserializeObject<T>(json);
        var deserializedArticles = await DeserializeAsync<List<Article>>(result);
        Assert.Equal(expectedArticles, deserializedArticles.Count);
    }
}
```

However, we're going to have a problem because if you have properly defined the
`AppDbContext` DI registration scope as `Scoped`, then the instance that is accessed
by the test will be different than the instance used by the web server and they will not
share a transaction scope.

In other words, the web server will return an empty set because it is unaware of the `Articles` created in the currently uncommitted test transaction.
To handle this, we can create a new `TestStartup` class that registers the `AppDbContext` as a singleton.
Remember, that this is not an implementation of a traditional [singleton pattern in C#](http://csharpindepth.com/Articles/General/Singleton.aspx).
In this context the term "singleton" just means that any lookups on the **same container instance** will receive the same **service instance**.
This means transaction isolation is preserved between tests as long as tests do not share a `TestServer` instance even if they run in the same process.

```csharp
public class TestStartup
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddSingleton<DbContext, AppDbContext>();
        // ...
    }
}
```

## Creating the Database

Finally, we need to make sure the database is created and all migrations have been applied.
To avoid a performance hit, we only want to run `DbContext.Database.Migrate()` once.
One way to do this is to add one more fixture to our inheritance hierarchy that creates the database once in its static
constructor:

```csharp
public class Fixture
{
    static Fixture()
    {
        CreateDatabase();
    }

    private static void CreateDatabase()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(/* ... */)
            .Options;
        new AppDbContext(options).Database.Migrate();
    }
}

public class WebFixture<TStartup> : Fixture,
    IDisposable
    where TStartup : class
{ /* ... */ }

public class Articles_Tests : WebFixture<TestStartup>
{ /* ... */ }
```

## Not Using Entity Framework?

As long as you're using an ORM or data access layer that can create transactions, this is no problem.
Here is what your fixture might look like if you're using Dapper:

```csharp
public class DapperFixture : Fixture, IDisposable
{
    public DapperFixture()
    {
        Connection = new NpgsqlConnection(Configuration["DbConnection"]);
        Connection.Open();
        Transaction = Connection.BeginTransaction();
    }

    protected IDbConnection Connection { get; }
    protected IDbTransaction Transaction { get; }

    public void Dispose()
    {
        if(Transaction != null)
        {
            Transaction.Rollback();
            Transaction.Dispose();
            Connection.Dispose();
        }
    }
}
```

This requires your application to be structured in such a way that you can substitute an `IDbConnection`.
If you're using the repository pattern, an example might look like:

```csharp
public class ArticleRepository
{
    private readonly IDbConnection _dbConnection;

    public ArticleRepository(IDbConnection dbConnection)
    {
        _dbConnection = dbConnection;
    }

    public async Task<List<Article>> GetArticlesAsync()
        => (await _dbConnection.GetAllAsync<Article>()).ToList();
}
```

In this case, you'd be able to test the `ArticleRepository` directly by constructing it with an instance
of `DapperFixture.Connection` which will be wrapped in a transaction.

## Summary

With the solutions provided above, you'll be able to write transactional integration tests that run in isolation
and reduce the amount of cleanup code you'll be required to write.
There is also a huge performance benefit if you've been dropping and re-creating your databases between test runs
since the database only has to be created once.
I've provided a full example that uses [Entity Framework](https://github.com/jaredcnance/TransactionalTests/blob/master/test/WebAppTests/AcceptanceTests/Articles_Tests.cs)
and also one that uses
[Dapper](https://github.com/jaredcnance/TransactionalTests/blob/master/test/WebAppTests/IntegrationTests/ArticleRepository_Tests.cs) in the
[corresponding GitHub repository](https://github.com/jaredcnance/TransactionalTests).
