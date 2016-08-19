---
layout: post
title:  "Long Running Tasks In .Net Core With Hangfire"
date:   2016-08-19 08:00:00 -0500
categories: dotnet core async
comments: true
---

Follow along on [Github](https://github.com/jaredcnance/hangfire-dot-net-core-example)

## Why?

Typically, when we think of an ideal RESTful service, it's one that does very simple CRUD tasks. 
However, sometimes these tasks aren't so simple and the reasons are out of our control.
Currently, I am required to build a service that is exposed to a vendor application and am constrained by the rules of the vendor application.
Because of these constraints, creation of resources is not so simple. Those constraints are:
 
 - The vendor POSTs information about the resource, but not the resource itself requiring my service to fetch additional information
 - The vendor client requires a quick HTTP status code response otherwise it will time out. 

## The Solution: Asynchronous Background Processing With Hangfire

[Hangfire](http://hangfire.io/) seems to be the most popular, well maintained, and well documented background processor for .Net and with their recent [upgrade to support .Net Core](https://github.com/HangfireIO/Hangfire/pull/604), they seem like the best candidate.

Hangfire is discussed in detail elsewhere and [Scott Hanselman](http://www.hanselman.com/blog/HowToRunBackgroundTasksInASPNET.aspx) does an excellent job going over this exact topic.

## Installation

If you are running an app on netcoreapp or netstandard, you should be able to install it just by running `Install-Package Hangfire` or by adding the following to your project.json dependencies:

```
"Hangfire": "1.6.2"
```

However, if you are running against net451 (I am because I am waiting on other dependencies to be upgraded), you will need to add the following to your project.json:

```
"Hangfire.AspNetCore": "1.6.2",
"Hangfire.SqlServer": "1.6.2" // only if you are using SQL Server as your backing data store
```

## Register the Services

In `Startup.cs` add the following to `ConfigureServices(...)`:

{% highlight csharp %}
services.AddHangfire(config =>
{
    config.UseSqlServerStorage(Configuration["Data:WorkQueue"]);
});
{% endhighlight %}

Be sure to add the connections string to your sql server or LocalDb store in your `appsettings.json` file.

Add the HangfireServer to the request pipeline:

{% highlight csharp %}
public void Configure(IApplicationBuilder app, ILoggerFactory loggerFactory)
{
    loggerFactory.AddConsole(Configuration.GetSection("Logging"));
    loggerFactory.AddDebug();
    
    app.UseHangfireServer();

    app.UseMvc();
}
{% endhighlight %}

## Injecting Services

Hangfire provides a [way to inject dependencies](http://docs.hangfire.io/en/latest/background-methods/passing-dependencies.html) and we can lean on .Net Core's IServiceProvider as our dependency container.

So, per the [documentation](http://docs.hangfire.io/en/latest/background-methods/using-ioc-containers.html), we can extend the Hangfire activator like so:

{% highlight csharp %}
// ServiceProviderActivator.cs

using System;
using Hangfire;

public class ServiceProviderActivator : JobActivator
{
    private readonly IServiceProvider _serviceProvider;

    public ServiceProviderActivator(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public override object ActivateJob(Type type)
    {
        return _serviceProvider.GetService(type);
    }
}
{% endhighlight %}

Now, let's create the service responsible for executing the long running task:

{% highlight csharp %}
// Services/TodoItemService.cs
public class TodoItemService : IDisposable
{
    private readonly ApplicationDbContext _context;

    public TodoItemService(IConfigurationRoot configuration)
    {
        // create the context here to avoid access to a disposed context
        var dbContextOptionsBuilder = new DbContextOptionsBuilder();
        dbContextOptionsBuilder.UseSqlServer(configuration["Data:DefaultConnection"]);
        _context = new ApplicationDbContext(dbContextOptionsBuilder.Options);
    }

    public void CreateTodoItem(TodoItem todoItem)
    {
        Console.WriteLine("Run started");

        _context.TodoItems.Add(todoItem);
        _context.SaveChanges();

        Thread.Sleep(10000);

        Console.WriteLine("Run complete");
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
{% endhighlight %}

Then we can configure it in `Startup.cs` like so:

{% highlight csharp %}
public void ConfigureServices(IServiceCollection services)
{
    services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(Configuration["Data:DefaultConnection"]),
            ServiceLifetime.Transient);

    services.AddHangfire(config =>
    {
        config.UseSqlServerStorage(Configuration["Data:WorkQueue"]);
    });

    // add our service to the ServiceProvider container
    services.AddSingleton(new TodoItemService(Configuration));

    services.AddMvc();
}

public void Configure(IApplicationBuilder app, ILoggerFactory loggerFactory, IServiceProvider serviceProvider)
{
    loggerFactory.AddConsole(Configuration.GetSection("Logging"));
    loggerFactory.AddDebug();

    // add our activator to the GlobalConfiguration
    GlobalConfiguration.Configuration.UseActivator(new ServiceProviderActivator(serviceProvider));
    
    app.UseHangfireServer();

    app.UseMvc();
}
{% endhighlight %}

And that's it. The full source code is on [Github](https://github.com/jaredcnance/hangfire-dot-net-core-example) If you run the app and send a POST to `http://localhost:5000/api/todoitems` you can see the job being created and executed.

