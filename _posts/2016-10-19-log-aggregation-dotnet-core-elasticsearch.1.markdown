---
layout: post
title:  "Log Aggregation in .Net Core using Elasticsearch"
date:   2016-10-19 00:00:00 -0500
categories: dotnet core logging
comments: true
image: ElasticsearchDiagram.png
description: A quick walkthrough on how you can implement log aggregation across your .Net Core microservice swarm
---

## Introduction

In this post I will be going over the steps required to aggregate logs across multiple services using the architecture described in the image below. 
There is a demo video at the bottom of this post if you'd like to skip ahead to see what you're getting out of this.
The tools I will be using include:

- [.Net Core](https://www.microsoft.com/net/core)
- [Serilog](https://github.com/serilog/serilog)
- [Serilog.Sinks.RabbitMQ](https://github.com/sonicjolt/serilog-sinks-rabbitmq)
- [RabbitMQ](https://www.rabbitmq.com/)
- [RabbitMQ .Net Client](https://github.com/rabbitmq/rabbitmq-dotnet-client)
- [Logstash](https://www.elastic.co/products/logstash)
- [Elasticsearch](https://www.elastic.co/products/elasticsearch)
- [Kibana](https://www.elastic.co/products/kibana) 

![Elasticsearch](/assets/ElasticsearchDiagram.png)

I do not go into extreme detail here, so it would be useful to have some basic understanding of the following things:

 - DI in .Net Core
 - RabbitMQ Topic Exchanges

## Add Serilog to the Application

 - Add to `project.json` and run `dotnet restore`

{% highlight json %}
{
  "Serilog.Extensions.Logging": "1.2.0",
  "Serilog.Sinks.RabbitMQ": "2.0.0-*"
}
{% endhighlight %}

 - Configure logger factory to use Serilog. In this example I am using Autofac as my IoC Container instead of the default IServiceProvider. 
The main reason I would use Autofac instead of the default provider is because I can use [Type Interceptors](http://docs.autofac.org/en/latest/advanced/interceptors.html) 
to handle most of the logging instead of doing it directly inline and breaking the Single Responsiblity Principle. 
As a side note, you [can't do this in dotnet core yet](https://github.com/autofac/Autofac.Extras.DynamicProxy/issues/8).

{% highlight csharp %}
public IServiceProvider ConfigureServices(IServiceCollection services)
{
  var builder = new ContainerBuilder(); // instantiate the Autofac container builder

  var rabbitMQConfig = new RabbitMQConfiguration {
    Hostname = _config["RABBITMQ_HOST"],
    Username = _config["RABBITMQ_USER"],
    Password = _config["RABBITMQ_PASSWORD"],
    Exchange = _config["RABBITMQ_EXCHANGE"],
    ExchangeType = _config["RABBITMQ_EXCHANGE_TYPE"],
    DeliveryMode = RabbitMQDeliveryMode.Durable,
    RouteKey = "Logs",
    Port = 5672
  };

  Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .WriteTo.RabbitMQ(rabbitMQConfig, new JsonFormatter())
    .CreateLogger();

  var loggerFactory = new LoggerFactory();
  loggerFactory
    .AddSerilog()
    .AddConsole(LogLevel.Information);
    
  _builder.RegisterInstance<ILoggerFactory>(loggerFactory);

  _logger = loggerFactory.CreateLogger<DependencyRegister>();

  builder.Build();

  return new AutofacServiceProvider(this.ApplicationContainer);
}
{% endhighlight %}

So, let's break it down. The first thing we are doing is setting up our configuration for rabbitMQ.
We are then configuring the Serilog logger and instructing it to use RabbitMQ as a sink for the logs. 
You can find a list of all available sinks [here](https://github.com/serilog/serilog/wiki/Provided-Sinks). 
We then create the logger factory and instruct it to use both Serilog and stdout (Console).
The rest of the code is registering the factory instance and building the service provider.

### Logging

Okay, so now that we have add the logger factory to the service provider, we can start logging. 
I'm going to assume you are either using the built in DI framework for dotnet web applications or using something like 
[DotNetCoreApplications](https://github.com/Research-Institute/DotNetCoreApplications) that will handle root compostition for you.

In either case, the logger factory will be available in your service constructors and you can create a logger like so:

{% highlight csharp %}
// Application.cs
public Application (ILoggerFactory loggerFactory, IHostingEnvironment env)
{
  _logger = loggerFactory.CreateLogger<Application>();
  _env = env;
}
{% endhighlight %}

Now we can log something like so:

{% highlight csharp %}
// Application.cs
public void Run ()
{
  _logger.LogInformation("Application started in environment {@Environment}", _env.EnvironmentName, Trace.GetData());
}
{% endhighlight %}

What I'm doing here is parameterizing the environment name along with some trace object that will be searchable by Elasticsearch.
Like I mentioned above, I don't like doing this directly inline and would prefer to lean on the DI framework, 
but I will just have to wait until [this is resolved](https://github.com/autofac/Autofac.Extras.DynamicProxy/issues/8). 
If you're interested in implementing this pattern, check out [Erik Heemskerk's blog](https://www.erikheemskerk.nl/inspecting-aspects-interception/). 

## RabbitMQ

Now that we have an application to collect logs from, let's setup our RabbitMQ server. 
RabbitMQ will handle the delivery of our messages from the application to the Logstash instance. 

 - [Install](https://www.rabbitmq.com/install-homebrew.html)

{% highlight bash %}
$ brew update
$ brew install rabbitmq
{% endhighlight %}

 - Start the server

{% highlight bash %}
$ rabbitmq-server
{% endhighlight %}

 -  Use the web control panel (http://localhost:15672/) to configure authentication. The default username/password is guest/guest.  

## Logstash

Logstash will respond to messages on the specified RabbitMQ queue and pass them along to our Elasticsearch cluster. 
We can also do some optional message formatting here using the logstash filters. 

 - Install

{% highlight bash %}
$ brew install logstash
{% endhighlight %}

 - Verify you have the rabbitmq plugin

{% highlight bash %}
$ logstash-plugin list | grep rabbitmq
logstash-input-rabbitmq
logstash-output-rabbitmq
{% endhighlight %}

 - Create config file with a [rabbitmq input](https://www.elastic.co/guide/en/logstash/current/plugins-inputs-rabbitmq.html) and an [elasticsearch output](https://www.elastic.co/guide/en/logstash/current/plugins-outputs-elasticsearch.html)

{% highlight ruby %}
input {
  rabbitmq {
    host => localhost
    subscription_retry_interval_seconds => 5
    port => 5672
    user => "guest"
    password => "guest"
    key => "Logs"
    queue => "Logstash"
    durable => true
    exchange => "topic_messages"
  }
}
output {
  stdout { }
  elasticsearch {
    hosts => ["localhost:9200"]
    sniffing => true
    manage_template => false
    index => "MyIndex"
  }
}
{% endhighlight %}

Modify the input configuration as needed. The configuration above creates a queue call "Logstash" that is bound to the "Logs" routing key on the "topic_messages" exchange. 
Note that the exchange and routing key should match the configuration used in the .Net application above.

The output section is instructing Logstash to use stdout as well as elasticsearch.

## Elasticsearch

 - [Install](https://gist.github.com/jpalala/ab3c33dd9ee5a6efbdae)

{% highlight bash %}
$ brew install elasticsearch
$ brew info elasticsearch
{% endhighlight %}

 - Start

{% highlight bash %}
# run in background
$  brew services start elasticsearch
# run in shell
$ elasticsearch
{% endhighlight %}

## Kibana
 - Install

{% highlight bash %}
$ brew install kibana
{% endhighlight %}

 - Start

{% highlight bash %}
$ kibana
{% endhighlight %}

 - Open browser to http://localhost:5601/


## Demo

<video class="featured wide" controls="" style="width: 100%;"><source src="/assets/ElasticsearchDemo.mp4" type="video/mp4"></video>


## What's Next?

There are two major things I'd like to accomplish after writing this post:  

 - Following up with a demonstration of how to use this setup with multiple applications deployed to a Docker Swarm cluster
 - Work on an event tracing framework for distributed systems in .Net core - I haven't found anything that works for me, so if you have any suggestions, please let me know in the comments section

As always please leave any feedback you have for me in the comments section.

## Recommended Reading
- [Logstash - Config File Structure](https://www.elastic.co/guide/en/logstash/current/configuration-file-structure.html)
- [Logstash - Working with Plugins](https://www.elastic.co/guide/en/logstash/current/working-with-plugins.html)
- [How To Install Elasticsearch, Logstash, and Kibana (ELK Stack) on Ubuntu 14.04](https://www.digitalocean.com/community/tutorials/how-to-install-elasticsearch-logstash-and-kibana-elk-stack-on-ubuntu-14-04)
- [https://www.elastic.co/blog/index-vs-type](https://www.elastic.co/blog/index-vs-type)