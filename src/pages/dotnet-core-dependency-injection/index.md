---
title: .Net Core Dependency Injection
date: "2017-10-16T00:00:00.000Z"
---

> This is a cross-post from [stackify.com](https://stackify.com/net-core-dependency-injection)

## What is Dependency Injection?

[Dependency Injection](https://www.martinfowler.com/articles/injection.html) (DI) is a pattern that can help developers decouple the different pieces of their applications. It provides a mechanism for the construction of dependency graphs independent of the class definitions. Throughout this article, I will be focusing on [constructor injection](https://en.wikipedia.org/wiki/Dependency_injection#Constructor_injection) where dependencies are provided to consumers through their constructors. Consider the following classes:

```csharp
class Bar : IBar {
  // ...
}

class Foo {
  private readonly IBar _bar;
  public Foo(IBar bar) {
    _bar = bar;
  }
}
```

In this example, `Foo` depends on `IBar` and somewhere we’ll have to construct an instance of Foo and specify that it depends on the implementation `Bar` like so:

```csharp
var bar = new Bar();
var foo = new Foo(bar);
```

The problem with this is two-fold. Firstly, it violates the [Dependency Inversion Principle](https://en.wikipedia.org/wiki/Dependency_inversion_principle) because the consuming class [implicitly depends](http://deviq.com/explicit-dependencies-principle/) on the concrete types `Bar` and `Foo`. Secondly, it results in a scattered definition of the dependency graph and can make unit testing very difficult.

The [Composition Root](http://blog.ploeh.dk/2011/07/28/CompositionRoot/) pattern states that the entire dependency graph should be composed in a single location “as close as possible to the application’s entry point”. This could get pretty messy without the assistance of a framework. DI frameworks provide a mechanism, often referred to as an Inversion of Control (IoC) Container, for offloading the instantiation, injection, and lifetime management of dependencies to the framework. You invert the control of component instantiation from the consumers to the container, hence “Inversion of Control”.

To do this, you simply register services with a container, and then you can load the top level service. The framework will inject all child services for you. A simple example, based on the class definitions above, might look like:

```csharp
container.Register<Bar>().As<IBar>();
container.Register<Foo>();
// per the Composition Root pattern, this _should_ be the only lookup on the container
var foo = container.Get<Foo>();
```

## Dependency Injection in ASP.Net Core

Prior to [.Net Core](http://stackify.com/net-core-2-0-changes/), the only way to get DI in your applications was through the use of a framework such as [Autofac](https://autofac.org/), [Ninject](http://www.ninject.org/), [StructureMap](https://structuremap.github.io/) and [many others](https://github.com/danielpalme/IocPerformance). However, DI is treated as a [first-class citizen](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection) in ASP.Net Core. You can configure your container in your `Startup.ConfigureServices` method:

```csharp
public class Startup {
  public void ConfigureServices(IServiceCollection services) {
    services.AddTransient<IArticleService, ArticleService>();
  }
  // ...
}
```

When a request gets routed to your controller, it will be [resolved from the container](https://github.com/aspnet/Mvc/blob/eeac99985a61e75ca48e620f0371e16df018d6d7/src/Microsoft.AspNetCore.Mvc.Core/Controllers/ServiceBasedControllerActivator.cs#L16-L26) along with all its dependencies:

```csharp
public class ArticlesController : Controller {
  private readonly IArticleService _articleService;
  public ArticlesController(IArticleService articleService) {
    _articleService = articleService;
  }

  [HttpGet("{id}"]
  public async Task<IActionResult> GetAsync(int id) {
    var article = await _articleService.GetAsync(id);
    if(article == null)
      return NotFound();
    return Ok(article);
  }
}
```

### Dependency Lifetimes

At registration time, dependencies require a lifetime definition. The service lifetime defines the conditions under which a new service instance will be created. Below are the lifetimes defined by the ASP.Net DI framework. The terminology may be different if you choose to use a different framework.

* **Transient** – Created every time they are requested
* **Scoped** – Created once per scope. Most of the time, scope refers to a web request. But this can also be used for any unit of work, such as the execution of an Azure Function.
* **Singleton** – Created only for the first request. If a particular instance is specified at registration time, this instance will be provided to all consumers of the registration type.

### Using Different Providers

If you would like to use a more mature DI framework, you can do so as long as they provide an [IServiceProvider](https://github.com/dotnet/corefx/blob/c6dbe361680efd21a20fdb8def01936b1031011c/src/System.ComponentModel/src/System/IServiceProvider.cs#L7-L10) implementation. If they don’t provide one, it is a very [simple interface](https://github.com/dotnet/corefx/blob/c6dbe361680efd21a20fdb8def01936b1031011c/src/System.ComponentModel/src/System/IServiceProvider.cs#L7-L10) that you should be able to implement yourself. You would just return an instance of the container in your ConfigureServices method. Here is an example using [Autofac](https://www.nuget.org/packages/Autofac/4.6.1):

```csharp
public class Startup {
  public IServiceProvider ConfigureServices(IServiceCollection services) {
    // setup the Autofac container
    var builder = new ContainerBuilder();
    builder.Populate(services);
    builder.RegisterType<ArticleService>().As<IArticleService>();
    var container = builder.Build();
    // return the IServiceProvider implementation
    return new AutofacServiceProvider(container);
  }
  // ...
}
```

### Generics

Dependency injection can get really interesting when you start working with generics. Most DI providers allow you to register [open generic types](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/types) that will have their generic arguments set based on the requested generic type arguments. A great example of this is Microsoft’s new logging framework (Microsoft.Extensions.Logging). If you look [under the hood](https://github.com/aspnet/Logging/blob/af314d54058389c8685dbaeb360c9aa9caea0af5/src/Microsoft.Extensions.Logging/LoggingServiceCollectionExtensions.cs#L42) you can see how they inject the open generic `ILogger<>`:

```csharp
services.TryAdd(ServiceDescriptor.Singleton(typeof(ILogger<>), typeof(Logger<>)));
```

This allows you to depend on the generic `ILogger<>` like so:

```csharp
public class Foo {
  public Foo(ILogger<Foo> logger) {
    logger.LogInformation("Constructed!!!");
  }
}
```

Another common use case is the [Generic Repository Pattern](https://cpratt.co/truly-generic-repository/). Some consider this an [anti-pattern](https://www.infoworld.com/article/3117713/application-development/design-patterns-that-i-often-avoid-repository-pattern.html) when used with an ORM like Entity Framework because it already implements the Repository Pattern. But, if you’re unfamiliar with DI and generics, I think it provides an easy entry point.

Open generic injection also provides a great mechanism for libraries (such as [JsonApiDotNetCore](https://github.com/json-api-dotnet/JsonApiDotNetCore)) to offer default behaviors with easy extensibility for applications. Suppose a framework provides an out-of-the-box, implementation of the generic repository pattern. It may have an interface that looks like this, implemented by a `GenericRepository`:

```csharp
public interface IRepository<T> where T : IIdentifiable {
   T Get(int id);
}
```

The library would provide some `IServiceCollection` extension method like:

```csharp
public static void AddDefaultRepositories(this IServiceCollection services) {
  services.TryAdd(ServiceDescriptor.Scoped(typeof(IRepository<>), typeof(GenericRepository<>)));
}
```

And the default behavior could be supplemented by the application on a per resource basis by injecting a more specific type:

```csharp
services.AddScoped<IRepository<Foo>, FooRepository>();
```

And of course `FooRepository` can inherit from `GenericRepository<>`.

```csharp
class FooRepository : GenericRepository<Foo> {
  Foo Get(int id) {
    var foo = base.Get(id);
    // ...authorization of resources or any other application concerns can go here
    return foo;
  }
}
```

## Beyond the Web

The ASP.Net team has separated their DI framework from the ASP.Net packages into [Microsoft.Extensions.DependencyInjection](https://www.nuget.org/packages/Microsoft.Extensions.DependencyInjection/). What this means is that you are not limited to web apps and can leverage these new libraries in event-driven apps (such as Azure Functions and AWS Lambda) or in thread loop apps. All you need to do is:

1.  Install the framework NuGet package:

```
Install-Package Microsoft.Extensions.DependencyInjection
```

or

```
dotnet add package Microsoft.Extensions.DependencyInjection
```

2.  Register your dependencies on a static container:

```csharp
var serviceCollection = new ServiceCollection();
serviceCollection.AddScoped<IEmailSender, AuthMessageSender>();
serviceCollection.AddScoped<AzureFunctionEventProcessor, IEventProcessor>();
Container = serviceCollection.BuildServiceProvider();
```

3.  Define the lifetime scope (if applicable) and resolve your top level dependency:

```csharp
var serviceScopeFactory = Container.GetRequiredService<IServiceScopeFactory>();
using (var scope = serviceScopeFactory.CreateScope())
{
  var processor = scope.ServiceProvider.GetService<IEventProcessor>();
  processor.Handle(theEvent);
}
```

[Under the hood](https://github.com/aspnet/DependencyInjection/blob/06e2de235ce5b27b425e823d9dcbd045811ba48e/src/DI/ServiceLookup/ServiceProviderEngine.cs#L26), the call to `.BuildServiceProvider()` will inject an [`IServiceScopeFactory`](https://github.com/aspnet/DependencyInjection/blob/d5e5aa703297b164b21ba4ad3fdff81c854ce009/src/DI.Abstractions/IServiceScopeFactory.cs#L10). You can load this service and define a scope so you can use properly scoped services.

### Disposable Services

If a registered service implements `IDisposable` it will be disposed of when the containing scope is disposed. You can see how this is done here. For this reason, it is important to always resolve services from a scope and not the root container, as described above. If you resolve `IDisposable`s from the root container, you may create a memory leak since these services will not be disposed of until the container gets disposed.

### Dynamic Service Resolution

Some DI providers provide resolution time hooks that allow you to make runtime decisions about dependency injection. For example, Autofac provides an [`AttachToComponentRegistration`](https://autofac.org/apidoc/html/DB09DDBB.htm) method that can be used to make runtime decisions. At Stackify, we used this with [Azure Functions](http://stackify.com/azure-functions-performance-monitoring-retrace/) to wrap the [TraceWriter](https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-csharp#logging) (before they [supported the ILogger interface](https://github.com/Azure/Azure-Functions/issues/293)) behind a facade. This facade passed the logging method calls to the scoped `TraceWriter` instance as well as our log4net logger. To do this, we register the instance of the `TraceWriter` when we begin the lifetime scope:

```csharp
using (var scope = ServiceProvider.BeginLifetimeScope(b => b.RegisterInstance(traceWriter)))
{
  // ...
}
```

I’ve [created a gist here](https://gist.github.com/jaredcnance/45f5e7d367a02375c588087160e8f126) that you can reference if you’d like to see the rest of the implementation.

### When Not To Use IoC Containers

In general, IoC containers are an application concern. What this means is library and framework authors should think carefully about whether or not it is really necessary to create an IoC container within the package itself. An example of one that does this is the AspNetCore.Mvc framework packages. However, this framework is intended to manage the life of the application itself. This is very different than say a logging framework.

## Conclusion

Dependency Injection describes the pattern of passing dependencies to consuming services at instantiation. DI frameworks provide IoC containers that allow developers to offload control of this process to the framework. This lets us decouple our modules from their concrete dependencies, improving [testability](http://stackify.com/fundamentals-web-application-performance-testing/) and extensibility of our applications.

> Note
> All of the source code links used in this article are permalinks to the code on the default repository branches. These links should be used as a reference and not as the current state of the underlying implementations or APIs since these are subject to change at any time
