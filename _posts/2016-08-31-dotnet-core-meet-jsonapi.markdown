---
layout: post
title: ".Net Core meet JSONAPI"
date: 2016-08-31 12:00:00 -0500
categories: dotnet core emberjs
comments: true
description: "Demonstrating a new library for .Net Core that eliminates a significant amount of boiler plate for web apps"
tags:
  - dotnet-core
  - emberjs
  - jsonapi
---

## What is JSONAPI?

Well, in short it is (as defined on the [official website](http://jsonapi.org/)), a specification for building APIs in JSON.
More specifically, it is a [HATEOAS](https://en.wikipedia.org/wiki/HATEOAS) specification that allows for some pretty amazing things.
EmberJS, in particular, provides a built in adapter that uses the JSONAPI links to manage fetching of relationships.
This is becoming the standard way of building an Ember app with Rails, using the [JSONAPI::Resources](https://github.com/cerebris/jsonapi-resources) library for rails.
There are several implementation listed on the [official website](http://jsonapi.org/implementations/), but none were for .Net Core and none worked quite like the Rails library mentioned above.
So, I decided to go ahead and attempt to build one. I just released [v0.1.0](https://github.com/Research-Institute/json-api-dotnet-core/releases/tag/0.1.0) today. 

## An Example

Over the next week, I plan on putting together video demonstration where I will create an API and EmberJS app using JSONAPI. 

But until then, there is an example application included in the repo. 

Performing the following steps is the quickest way to a working example:

- `git clone https://github.com/Research-Institute/json-api-dotnet-core.git`
- `cd json-api-dotnet-core/JsonApiDotNetCoreExample/`
- `dotnet restore`
- `dotnet run`
- `curl -X GET -H "Content-Type: application/vnd.api+json" "http://localhost:5000/api/v1/todoItems/"`

## Installation

You can install the package from [NuGet](https://www.nuget.org/packages/JsonApiDotNetCore/) using: `Install-Package JsonApiDotNetCore`
or by adding this to your project.json file: `"JsonApiDotNetCore": "0.1.0"` ad run `dotnet restore`.

## Usage

- Configure the service:

{% highlight csharp %}
services.AddDbContext<ApplicationDbContext>(options =>
  options.UseNpgsql(Configuration["Data:ConnectionString"]),
  ServiceLifetime.Transient);

services.AddJsonApi(config => {
  config.SetDefaultNamespace("api/v1");
  config.UseContext<ApplicationDbContext>();
});
{% endhighlight %}

- Add middleware:

{% highlight csharp %}
app.UseJsonApi();
{% endhighlight %}

## Specifying The Presenter / ViewModel

 - When you define a model, you **MUST** specify the associated resource class using the `JsonApiResource` attribute.
 - The specified resource class **MUST** implement `IJsonApiResource`. 

The resource class defines how the model will be exposed to client applications.

For example:

{% highlight csharp %}
[JsonApiResource(typeof(PersonResource))]
public class Person
{
  public int Id { get; set; }
  public string Name { get; set; }
  public string SomethingSecret { get; set; }
  public virtual List<TodoItem> TodoItems { get; set; }
}

public class PersonResource : IJsonApiResource
{
  public string Id { get; set; }
  public string Name { get; set; }
}
{% endhighlight %}

We use [AutoMapper](http://automapper.org/) to map from the model class to the resource class. 
The below snippet shows how you can specify a custom mapping expression in your `Startup` class that will append `_1` to the resource name.
Check out [AutoMapper's Wiki](https://github.com/AutoMapper/AutoMapper/wiki) for detailed mapping options.

{% highlight csharp %}
services.AddJsonApi(config => {
  config.AddResourceMapping<Person, PersonResource>(map =>
  {
    // resource.Name = model.Name + "_1"
    map.ForMember("Name", opt => opt.MapFrom(src => $"{((Person)src).Name}_1"));
  });
});
{% endhighlight %}

## Overriding controllers

You can define your own controllers that implement the `IJsonApiController` like so:

{% highlight csharp %}
services.AddJsonApi(config => {
  config.UseController<TodoItem, TodoItemsController>();
});
{% endhighlight %}

The controller **MUST** implement `IJsonApiController`, and it **MAY** inherit from [JsonApiController](https://github.com/Research-Institute/json-api-dotnet-core/blob/master/JsonApiDotNetCore/Controllers/JsonApiController.cs).
Constructor dependency injection will work like normal. 
Any services added in your `Startup.ConfigureServices()` method will be injected into the constructor parameters.

{% highlight csharp %}
public class TodoItemsController : JsonApiController, IJsonApiController
{
  private ApplicationDbContext _dbContext;

  public TodoItemsController(IJsonApiContext jsonApiContext, ResourceRepository resourceRepository, ApplicationDbContext applicationDbContext) 
  : base(jsonApiContext, resourceRepository)
  {
    _dbContext = applicationDbContext;
  }

  public override ObjectResult Get()
  {
    return new OkObjectResult(_dbContext.TodoItems.ToList());
  }
}
{% endhighlight %}