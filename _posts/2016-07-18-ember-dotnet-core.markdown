---
layout: post
title:  "Ember and .Net Core"
date:   2016-07-18 10:30:29 -0500
categories: dotnet ember
comments: true
---

## Introduction

I really like using EmberJS for large projects and previously, I was using it with Rails and JSONAPI. 
However, right now there is no good JSONAPI solution for .Net nor .Net Core and sometimes I find the HATEOAS verbosity unnecessary. 
So, rather than taking on the challenge of writing a JSONAPI Serializer for .Net, I am going to make a serializer that will work with Ember's RestAdapter.
The difference here is pretty straightforward. Requests to `/api/myEntities/1` currently return:

{% highlight json %}
{
    "id": 1,
    "name": "myName"
}
{% endhighlight %}

And we would like to include the root object like so:

{% highlight json %}
{
    "myEntity": {
        "id": 1,
        "name": "myName"
    }
}
{% endhighlight %}

And we need to apply pluralization to responses that return lists:
{% highlight json %}
{
    "myEntities": [{
        "id": 1,
        "name": "myName"
    }]
}
{% endhighlight %}

## Old Way

The way I was doing it was to use a `JsonDeserializationService` that was responsible for deserializing input. 
And then just wrapping all response in a dynamic object with the entity name as the root.

{% highlight csharp %}
// MyEntitiesController.cs
[HttpPost]
public IActionResult Post([FromBody] dynamic entity)
{
    // deserialize to type
    MyEntity myEntity;
    try
    {
        myEntity = JsonDeserializationService.ConvertToTypeFromRoot<MYEntity>(entity, "myEntity");
    }
    catch (JsonSerializationException)
    {
        return new StatusCodeResult(422);
    }

    ...

    return Ok(new { myEntity }); 
}

...

// JsonDeserializationService.cs
public static T ConvertToTypeFromRoot<T>(dynamic entity, string rootName)
{
    var value = entity.GetType().GetProperty(rootName)?.GetValue(entity); // used for tests
    if (value == null)
    {
        return ((JObject)entity)[rootName].ToObject<T>(); // used for actual HTTP requests
    }
    return (T)value;
}

{% endhighlight %}

As you can see this results in a lot of duplicate code. So, there has to be a better way...

## Enter dotnet-rest-serializer

The [dotnet-rest-serializer][dotnet-rest-serializer] project contains two formatter classes that you will need: `RootNameOutputFormatter : IOutputFormatter` and `RootNameInputFormatter : IInputFormatter`.

These classes handle the serialization and deserialization (as described above) in an automated way.

In order to use these formatters, you just need to include them in your `Startup.cs` file like so:

{% highlight csharp %}
// Startup.cs
public void ConfigureServices(IServiceCollection services)
{
  ...
  services.AddMvc(options =>
    {
        options.InputFormatters.Insert(0, new RootNameInputFormatter(Assembly.GetEntryAssembly()));
        options.OutputFormatters.Insert(0, new RootNameOutputFormatter());
    });
  ...
}
{% endhighlight %}

A full example can be found in the library [repo][dotnet-rest-serializer].

I did run into a few hiccups with the IInputFormatter implementation that will need to be resolved at some point.  

- I am currently making two trips through deserialization so that I can leverage Json.Net's deserialization to type. I first deserialize to `Dictionary<string,object>`, then I extract object, reserialize and deserialize as the desired type. Not Ideal.  
- Unless I am missing something, since there is no `AppDomain.CurrentDomain.GetAssemblies()`, there is currently no nice way to get the type for deserialization without passing in the desired assembly.  

[dotnet-rest-serializer]: https://github.com/Research-Institute/dotnet-rest-serializer