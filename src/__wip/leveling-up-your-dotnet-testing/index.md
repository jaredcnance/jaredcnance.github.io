---
title: Leveling Up Your .Net Testing Patterns - Part I
date: "2019-03-16T00:00:00.000Z"
---

This is a two part blog post in which I'll describe some techniques you can use to level up your .Net tests.
In part 1 of this series, I'm going to show you how to use model Factories to generate data and introduce entropy
into your tests.

## Factories

If you're not familiar with factories, they are a simple [creational pattern](https://en.wikipedia.org/wiki/Creational_pattern)
that abstract the instantiation process of a type. The simplest form a factory can take is:

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
(i.e. using `Guid` for strings is not going to do be reproducible).
But, we can do better.

Luckily, others have already done this kind of work for us. Some great projects for .Net are:

* [Bogus](https://github.com/bchavez/Bogus)
* [FakeItEasy](https://github.com/FakeItEasy/FakeItEasy)
* [Faker.Net](https://github.com/jonwingfield/Faker.Net)
* [NBuilder](https://github.com/nbuilder/nbuilder)

In this post, I'll be using Bogus, but you can do the same kinds of things with any of the above packages.

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
            .Generate();
}
```

Then in our tests we can use our factory:

```csharp
public async Task GetPrice_Returns_The_Expected_Item_Price()
{
    // arrange
    var item = ShoppingCartItemFactory.Get()[0];

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

## Reproducing Flaky Tests

One challenge with using generated data is that it can be difficult to reproduce failures locally.
So, the tests may fail during CI, but if you can't reproduce them consistently then it can be difficult to
track down root cause. I was recently working with [Ryan Tablada](https://twitter.com/RyanTablada) on this
exact issue and the solution he proposed was to use the same random seed for all tests and log that seed
at the beginning of the test.
He then allowed the random seed to be set by an environment variable when the test starts.

Each test can inherit from a base test fixture that sets the seed in its static constructor.
This will only be called once in a single test run so all tests will use the same seed.

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

And then when we re-run the test the model factories will use the same seeds and should generate
the exact same fake data and cause the test to fail again.

## Summary

Using test model factories to generate fake data for our unit tests is a good way to increase the coverage
of our tests across multiple runs while also providing the added benefit of making our tests more legible.
By adding randomness to our tests we can discover issues that may never be discovered through the use of
static test data.

## What's Next

In my next post on .Net testing, we'll cover transactional integration testing.
