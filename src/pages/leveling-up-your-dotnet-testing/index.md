---
title: Leveling Up Your .Net Testing Patterns - Part I
date: "2018-04-08T00:00:00.000Z"
---

This is a two part blog post in which I will provide guidelines, opinions and tools that you can use to improve your .Net testing experience.
In part 1, I will first introduce a proposed solution structure, then I will talk about the importance and challenges of making your tests
idempotent and finally I'll show you how to use model factories to generate fake data for your tests.

I am generally a fan of frameworks that reduce decision making by providing well thought out, sane default recommendations or opinions
about how things should be done. However, most .Net frameworks and libraries are predominantly un-opinionated which is good and bad.
The good part about it is that it provides you with extreme flexibility. The bad part is that it provides little to no guidance
around a good path for doing things.

I would like to point out that ASP.Net Core is much more opinionated than most .Net frameworks and does a really excellent job of
providing out-of-the-box tools like
[Dependency Injection](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection),
[Configuration](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/configuration/options),
[Environment loading](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/environments) and
[Identity Management](https://docs.microsoft.com/en-us/aspnet/core/security/authentication/identity).

## Project Structure

The first is a proposal for project structure. Here is a sample directory tree that I use for all new projects.
The `src` directory represents the actual application or class library projects that make up the Systems Under Test (SUT).
The `test` directory contains all of the test projects that will validate the `src` projects.

```
Solution/
├── src/
│   └── Project1/
│       ├── ...
│       └── Project1.csproj
└── tests/
    └── Project1Tests/
        ├── Acceptance/
        ├── Factories/
        ├── Integration/
        ├── Stubs/
        ├── Unit/
        ├── Utilities/
        ├── ...
        └── Project1Tests.csproj
```

### Project : TestProject Ratio

I recommend a 1:1 relationship between `src` projects and `tests` projects.
This makes it very clear where tests should live for a specific piece of functionality.
It also mitigates the risk that a test project could be running different assembly versions than what the application actually runs.
If a test project references several different application projects, and those projects reference a common dependency at different
versions it will have to generate
[assembly redirects](https://docs.microsoft.com/en-us/dotnet/framework/configure-apps/redirect-assembly-versions)
to a compatible dependency version.

### Test Project Structure

Within each test project, tests can be divided into 3 categories:

* **Unit**: Tests that target individual method functionality in isolation
* **Integration**: Tests that target multiple application layers
* **Acceptance**: End-to-end tests, commonly using the ASP.Net Core `TestServer` class

Tests generally require additional functionality to construct the scenarios to be tested.
These fall into 3 categories as well:

* **Factories**: Classes to generate fake data
* **Stubs**: When mocks aren't enough you may need to stub functionality. However, mocks should meet most requirements.
* **Utilities**: Classes that provide common functionality for debugging, setup, or validation.

## Tests Should be Idempotent

You should strive to make your tests idempotent, that is they should be able to run and pass anytime.
This means you should avoid using test framework decorators that prevent tests from running such as NUnit's
`[Explicit]` and xUnit's `[Fact(Skip="...")]`.

Often times developers will write tests to verify the functionality of a module at a particular time but fail to
write the test in such a way that it can be run consistently in the future.
I have observed four main causes of this:

1.  **The test depends on some external state that is difficult to construct**

In some cases these challenges are very real. But I encourage you to apply the initial investment
so that your tests can protect you against future changes. In my experience, once these test are excluded from the
test runs, they are rarely revisited. This means that all of the value gained from that test is realized during the
micro-development cycle in which it was written and afterwards provides no value to the project. With some extra
effort you will continue to reap benefits from that test for as long as that functionality exists.

2.  **The test has external side effects**

Generally, with a little effort and some clean up code—in xUnit this is done via `Dispose()`—this can be easily handled in most cases.
In part 2 of this blog post, I'll demonstrate how to make your tests transactional so that you don't even have to think
about this issue.

3.  **The test is flaky**

A flaky test is one that fails intermittently making the source of the error difficult to track down or reproduce.
Flaky tests are usually a sign that something else is going on and it may actually be a bug in your application or library.
Often times a test that fails intermittently is a sign that there is some boundary condition the test creates that is not
properly handled by the application. It could also mean that the test is not correctly testing the piece of functionality it
was intended to test and should be re-evaluated. Later on in this post I'll demonstrate one way to deal with intermittently
failing tests caused by input data.

4.  **The test is long running**

Long running tests can be a pain because you don't want to run them every time locally if you don't expect the behavior to
be affected. However, there are alternatives to labelling them as explicit. You can also decorate your xUnit tests with
`Trait`s and then filter by those. For example, if you want to skip long running tests you can label them as
`[Trait("Exclude","Local")]`. Then you can run all tests that haven't been excluded locally.

```
dotnet test --filter Exclude!=Local
```

You can also filter your tests by the domain you're working on. By default the test runner will filter by the FullyQualifiedName.
So, if you're working on several layers of your stack that are all namespaced under `Articles`, you can just:

```
dotnet test --filter Articles
```

## Factories

Factories are an excellent way to reduce the boilerplate for individual tests.
If you're not familiar with factories, they are a [creational pattern](https://en.wikipedia.org/wiki/Creational_pattern)
that abstract the instantiation process of a type.
The simplest form a factory can take is:

```csharp
public class BeerFactory
{
    public Beer Create() => new Beer();
}
```

The most common use of Factories is to provide a mechanism for the instantiation of different implementations of an
interface that is dependent upon some runtime condition. Often times this takes the form of a switch statement:

```csharp
public class BeerFactory
{
    public IBeer Create(BeerType beerType)
    {
        switch(beerType)
        {
            case BeerType.Ale:
                return new Ale();
            case BeerType.Stout:
                return new Stout();
            case BeerType.Lager:
                return new Lager();
            // ...
        }
    }
}
```

However, we're going to discuss an entirely different use case for Factories: test model instantiation.
We will use factories in our tests to:

* Isolate model creation
* Generate fake data and add entropy to our tests

The idea of using factories for test data is by no means a new concept and is ubiquitous in other communities.
However, I rarely see their use in .Net projects so, I wanted to write this post to try and make the concept
more relatable and concrete for .Net developers who may not be familiar with this practice.

To start let's consider the following test case that is intended to compute the cost of an item.

```csharp
public async Task GetPrice_Returns_The_Expected_Item_Price()
{
    // arrange
    var item = new ShoppingCartItem {
        Name = "Beer",
        UnitCost = 5.00m,
        Count = 5,
        CostType = CostType.Count
    };

    var expectedCost = item.UnitCost * item.Count;

    var itemCostCalculator = new ItemCostCalculator();

    // act
    var actualCost = itemCostCalculator.GetTotalPrice(item);

    // assert
    Assert.Equal(expectedCost, actualCost);
}
```

This test seems fine, but it's very static. Every time it runs it will do the same thing without variation
and doesn't flex the system very much. Alternatively, we could generate random values and manually construct
our instance:

```csharp
var item = new ShoppingCartItem {
    Name = Guid.NewGuid().ToString("N"),
    UnitCost = GetRandomDecimal(),
    Count = GetRandomInteger(),
    CostType = GetRandomEnum<CostType>()
};
```

This is better because we alter the inputs to our system under test (SUT) on every test run.
However, the problem with this is that you will have to write code that performs the generation
of these random values and it will not be reproducible in the event of a failure
(i.e. using `Guid` for strings is not going to be reproducible).

Luckily, others have already done this kind of work for us. Some great projects for .Net are:

* [Bogus](https://github.com/bchavez/Bogus)
* [FakeItEasy](https://github.com/FakeItEasy/FakeItEasy)
* [Faker.Net](https://github.com/jonwingfield/Faker.Net)
* [NBuilder](https://github.com/nbuilder/nbuilder)

I'll be using Bogus, but you can do the same kinds of things with any of the above packages.

So, to begin let's see an example of how we can create a factory for our `ShoppingCartItem`:

```csharp
using Bogus;

public static class ShoppingCartItemFactory
{
    public List<ShoppingCartItem> Get(int count = 1)
        => new Faker<ShoppingCartItem>()
            .RuleFor(i => i.Name, f.Commerce.Product())
            .RuleFor(i => i.UnitCost, f => f.Random.Decimal(min: 1))
            .RuleFor(i => i.Count, f => f.Random.Number(min: 1))
            .RuleFor(i => i.Weight, f => f.Random.Decimal(min: 1))
            .RuleFor(i => i.CostType, f => f.Random.PickRandom<ItemType>())
            .Generate(count);
}
```

Then in our tests we can use our factory:

```csharp
public async Task GetPrice_Returns_The_Expected_Item_Price()
{
    // arrange
    var item = ShoppingCartItemFactory.Get().First();

    var units = (item.ItemType == ItemType.Weighed)
        ? item.Weight
        : item.Count;

    var expectedCost = units * item.UnitCost;

    var itemCostCalculator = new ItemCostCalculator();

    // act
    var actualCost = itemCostCalculator.GetTotalPrice(item);

    // assert
    Assert.Equal(expectedCost, actualCost);
}
```

So, we're now generating fake data that may even resemble some of the actual inputs our system will receive.
And our test is a little more pleasant to read.
But, what kind of scenarios exist that fake data can actually help us catch?
Consider the following requirement:

> The total cost is the unit cost multiplied by the count if the unit is priced by count.
> However if the unit is priced by weight, then the total cost is the unit cost multiplied by the
> weight of the unit.

Okay so now consider a faulty `ItemCostCalculator` implementation that does not take item type
into consideration and assumes all items are priced by count:

```csharp
public class ItemCostCalculator
{
    public decimal GetTotalPrice(ShoppingCartItem item)
        => item.Count * item.UnitCost;
}
```

Our original test would have passed every time because we only ever tested the count condition.
However, we will get intermittent failures of our new test, because we expect the calculator to correctly
compute cost based on `ItemType`. We can now fix our `ItemCostCalculator` and the test will pass every time.

I would like to quickly point out that in this example you **should** write
multiple tests that test both conditions separately. However, the regular
use of fake data generation in tests helps us to catch mistakes like this one.

### Reproducing Flaky Tests

One challenge with using generated data is that it can be difficult to reproduce failures locally.
So, the tests may fail during CI, but if you can't reproduce them consistently then it can be difficult to
track down root cause. I was recently working with [Ryan Tablada](https://github.com/rtablada) on this
exact issue and the solution he proposed was to use the same seed for all data generation tests and log that seed
at the beginning of the test. This seed can be overridden by an environment variable, allowing us to re-run the
tests with the same fake data.

Each test can inherit from a base test fixture that sets the seed in its
[static constructor](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/static-constructors).
The CLR ensures that static constructors are only called once per process making this operation thread safe.
Since it is only called once, all tests will use the same seed and you will only log the seed once at the beginning
of the run.

Prior to .Net Core static constructors would be invoked per AppDomain rather than per process.
However, the AppDomain no longer exists so this is a non-issue for .Net Core users.
If you're using an older testing framework (e.g. [NUnit](http://nunit.org/docs/2.6.3/assemblyIsolation.html))
that provides AppDomain isolation between individual tests, this exact solution will probably not work for you.
However, most testing frameworks provide a way to share state across all tests, so using their built-in APIs should work.

```csharp
public class ItemCostCalculator_Tests : TestFixture { /*...*/ }

public class TestFixture
{
    private static int Seed;
    static TestFixture()
    {
        var currentSeed = Bogus.Randomizer.Seed;
        var seedOverride = Environment.GetEnvironmentVariable("TEST_SEED");
        Seed = (seedOverride != null) ? int.Parse(seedOverride) : currentSeed;
        Console.WriteLine($"Using test seed: {Seed}");
    }
}
```

Now in the instance constructor, we assign the seed back to the Bogus randomizer.
This will ensure that each individual test runs with the correct seed.

```csharp
public class TestFixture
{
    private static int Seed;
    static TestFixture()
    {
        var currentSeed = Bogus.Randomizer.Seed;
        var seedOverride = Environment.GetEnvironmentVariable("TEST_SEED");
        Seed = (seedOverride != null) ? int.Parse(seedOverride) : currentSeed;
        Console.WriteLine($"Using test seed: {Seed}");
    }

    public TestFixture()
    {
        Randomizer.Seed = new Random(Seed);
    }
}
```

By assigning the seed to the Bogus `Randomizer` in the instance constructor we can ensure that
each individual test within a test run will use the same seed.
So, when we get the intermittent failure described above, we should be able to go to our test log
and see something like:

```
Using test seed: 73202934
```

We can then pull the branch locally and set the environment variable:

CMD:

```
setx TEST_SEED 73202934
```

Bash:

```
export TEST_SEED=73202934
```

Now, when we re-run the test, the model factories will use the same seeds and generate
the same fake data causing the test to fail again.

## Summary

Using test model factories to generate fake data for our unit tests is a good way to increase the coverage
of our tests across multiple runs while also providing the added benefit of making our tests more legible.
By adding randomness to our tests we can discover issues that may never be discovered through the use of
static test data.

## What's Next

In my next post on .Net testing, I will show some ways we can make tests with side-effects idempotent via
test cleanup methods and transactional integration testing.
