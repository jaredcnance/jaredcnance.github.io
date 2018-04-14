webpackJsonp([0x60ee23c26a48],{550:function(n,a){n.exports={data:{site:{siteMetadata:{title:"nance.io",author:"Jared Nance"}},markdownRemark:{id:"/Users/jarednance/dev/gatsby-blog/src/pages/logging-in-azure-functions/index.md absPath of file >>> MarkdownRemark",html:'<blockquote>\n<p>This is a cross-post from <a href="https://stackify.com/logging-azure-functions">stackify.com</a></p>\n</blockquote>\n<p>If you are thinking about using Azure Functions, at some point you will be confronted with the challenge of figuring out how application logging works.\nLogging in Azure Functions has some unique challenges due to the stateless nature of the serverless execution model.\nIn this article, we will cover some basics about Azure Functions and provide instruction on how to write application logs.</p>\n<p>You can check out the final solution <a href="https://github.com/jaredcnance/AzureFunctionsLogging">here</a>.</p>\n<h2>Serverless 101</h2>\n<p>Azure Functions is one implementation of the serverless execution model.\nServerless compute platforms such as Azure Functions, AWS Lambda and Google Cloud Functions represent possibly the most significant change in how\napplication code is managed and executed since the rise of web applications.</p>\n<p>The idea is that we deploy our application code to a platform.\nThis platform bundles together the infrastructure and runtime framework responsible for hosting and invoking our application.\nTechnologies have existed that provide some of these features for web applications already (Azure App Service, Heroku, etc.).</p>\n<p>The main difference here is a common pattern for application development that is agnostic to how the application is invoked (HTTP request, timer, queue message, etc.).\nAzure Functions supports many different types of triggers, not just HTTP requests.</p>\n<h3>Infinite scale</h3>\n<p>Possibly the primary highlight of serverless is the ability to quickly scale up and down based on the demand.\nWe are no longer paying for a set of VMs constantly running whether they are being fully utilized or not.\nThis allows us to improve our utilization efficiency, paying only for what is used.</p>\n<h3>Stateless</h3>\n<p>Serverless applications are</p>\n<blockquote>\n<p>run in stateless compute containers that are event-triggered, ephemeral\n(may only last for one invocation), and fully managed by a 3rd party”\n<a href="https://martinfowler.com/articles/serverless.html">Fowler</a>.</p>\n</blockquote>\n<p>Note that .Net Azure Functions are only semi-stateless.\nFor performance reasons, there is no app domain isolation between functions within the same function app.\nThis means statics are persisted across invocations until the app domain is unloaded.</p>\n<h3>Ultimate simplicity (sometimes)</h3>\n<p>Serverless solutions such as Azure Functions are growing in popularity because of their promised simplicity.\nYou can just write all your code in your browser, right?\nI’m being facetious here — this strategy is unlikely to scale well for applications of even moderate complexity.\nHowever, while more things have been built into the framework and we can be concerned with less, this technology\nis very young and concerns that have been historically trivial with “first-class” applications require a bit more work.\nA good example of this is application logging.</p>\n<h2>History of Logging in Azure Functions</h2>\n<p>The first logging mechanism available in Functions was through the <code class="language-text">TraceWriter</code> class. You can accept a <code class="language-text">TraceWriter</code> instance as a parameter in your function method.</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">void</span> <span class="token function">Run</span><span class="token punctuation">(</span>Message message<span class="token punctuation">,</span> TraceWriter log<span class="token punctuation">)</span>\n<span class="token punctuation">{</span>\n  log<span class="token punctuation">.</span><span class="token function">Info</span><span class="token punctuation">(</span><span class="token string">"Function invoked."</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n  <span class="token comment">// ...</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p>The <code class="language-text">TraceWriter</code> will make logs available through the “Invocation log” in the portal and the command line when debugging with <a href="https://github.com/Azure/azure-functions-cli">func.exe</a>.\nYou can also view these logs in Kudu or as the raw data stored in Table Storage under the storage account configured using the <code class="language-text">AzureWebJobsStorage</code> setting.</p>\n<p>\n  <a\n    class="gatsby-resp-image-link"\n    href="/static/logs-1-f2c4d09bba377dab87d072e34f8d171e-9160a.png"\n    style="display: block"\n    target="_blank"\n    rel="noopener"\n  >\n  \n  <span\n    class="gatsby-resp-image-wrapper"\n    style="position: relative; display: block; ; max-width: 590px; margin-left: auto; margin-right: auto;"\n  >\n    <span\n      class="gatsby-resp-image-background-image"\n      style="padding-bottom: 66.2109375%; position: relative; bottom: 0; left: 0; background-image: url(\'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAANCAYAAACpUE5eAAAACXBIWXMAABYlAAAWJQFJUiTwAAACPElEQVQ4y3VSaY/aQAzN//8x/Y4q7YdKuw1HEnJOAiEcIVxLAwuEhBy8esxuuqu2lp5GY3ve2M9WzFmKrKiwPxU4ZjeUVYOyfuBW1ZC2SjOEmxPO+SOvKGtU7zmcT5B2v9+hfFMjrFcJxDiCF4Qoilsb/Eh04iOe9BC73ZZI7qibhuMSzac8JpzvL2iaGlciyvOCgvR7c28rkHbMSmwPGaqq4juFifTOubKLkjt5fKAcDik221dk1yuykpwUquuKq5AfyQfpOQepgtutxCJeYr3Z4Vea4l+meP4Inh9gOptjtoixJfJlskE4iWA7HoLRGCadh+MbVxgnK7ydTti97rHdvba4XDLkRQFF+D4Gmo7eQOPTEwLjyYTIHGi6gaFpwTCGmM0X3FKe54x4mcAVAcJoRh3uGKv1hir0PGiaBp3IhvQwCHxEUQhXEtInpmnCIOJkuWQZZNvSrkxc0P2GglCWD7/yIibo6C46moPvQwF1kkBb7vHj3f9kj9AxPPjbFDW1fD5fHoTXnHWXxFl2bbdD8cYTaLbL0B0Bl+7BdAbbH5PPg+EKRkItSQ2lTs2ntWnXh3x1XUOxbBvdbo/R7w8ghEe6jGGRdqraxYDa1kiOzXrd7tr/IEkV23HRJaJub4A+PRQ0cTlhy7LZr5Ouclgxacg72PxZ4s/WEsq1kJM0LQuy2tEoxDSa87Sl33FdPuP4b8IPfCGUyc8/VYZKbbue4AqN4RDPLyr61LL0LxYLfih1anjpv0L6JX4DVNvM3oM/C74AAAAASUVORK5CYII=\'); background-size: cover; display: block;"\n    >\n      <img\n        class="gatsby-resp-image-image"\n        style="width: 100%; height: 100%; margin: 0; vertical-align: middle; position: absolute; top: 0; left: 0; box-shadow: inset 0px 0px 0px 400px white;"\n        alt="logs 1"\n        title=""\n        src="/static/logs-1-f2c4d09bba377dab87d072e34f8d171e-fb8a0.png"\n        srcset="/static/logs-1-f2c4d09bba377dab87d072e34f8d171e-1a291.png 148w,\n/static/logs-1-f2c4d09bba377dab87d072e34f8d171e-2bc4a.png 295w,\n/static/logs-1-f2c4d09bba377dab87d072e34f8d171e-fb8a0.png 590w,\n/static/logs-1-f2c4d09bba377dab87d072e34f8d171e-526de.png 885w,\n/static/logs-1-f2c4d09bba377dab87d072e34f8d171e-9160a.png 1024w"\n        sizes="(max-width: 590px) 100vw, 590px"\n      />\n    </span>\n  </span>\n  \n  </a>\n    </p>\n<h2>Current State</h2>\n<p>The problem with <code class="language-text">TraceWriter</code> is that it is only useful for applications being executed by the Azure Functions runtime.\nSo we don’t want all of the classes in our application to be tightly coupled to <code class="language-text">TraceWriter</code>.\nWe want to have the ability to reuse the classes in other applications such as web or console apps.</p>\n<p>The best that we get is a minor abstraction of <code class="language-text">TraceWriter</code> in the form of the <code class="language-text">ILogger</code> interface.\nYou may recognize this as the interface introduced in ASP.NET Core through the Microsoft.Extensions.Logging.Abstractions package.\nAn example function using the ILogger interface looks like:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">void</span> <span class="token function">Run</span><span class="token punctuation">(</span>Message message<span class="token punctuation">,</span> ILogger log<span class="token punctuation">)</span>\n<span class="token punctuation">{</span>\n  log<span class="token punctuation">.</span><span class="token function">LogInformation</span><span class="token punctuation">(</span><span class="token string">"Function invoked."</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n  <span class="token comment">// ...</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p>Unfortunately, <a href="https://social.msdn.microsoft.com/Forums/en-US/10f139b2-8964-4487-b11f-6c74c891eeb5/using-custom-ilogger-in-azure-functions?forum=AzureFunctions">we are not provided any mechanism</a>\nto access the <code class="language-text">ILoggerFactory</code> instance that creates the loggers.\nThis means we need to create an implementation of the <a href="https://dotnetcodr.com/2013/04/25/design-patterns-and-practices-in-net-the-adapter-pattern/">Adapter pattern</a>\nso that our service code does not depend on the concrete <code class="language-text">TraceWriter</code> type.</p>\n<h2>log4net</h2>\n<p>See the full example implementation here. Some of the code below has been simplified to improve readability.</p>\n<p>Azure Functions does not load configuration from an app.config or web.config file. So the only way that we have to\nspecify our log4net configuration is through a <a href="https://logging.apache.org/log4net/release/manual/configuration.html#dot-config">separate config file</a>,\nas shown by an example in the <a href="https://github.com/jaredcnance/AzureFunctionsLogging/blob/master/AzureFunctionsLogging/Log4net/Log4Net.config">repository</a>.\nNow you can load the configuration file:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">private</span> <span class="token keyword">static</span> <span class="token keyword">string</span> _functionDirectory<span class="token punctuation">;</span>\n\n<span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">async</span> Task<span class="token operator">&lt;</span>HttpResponseMessage<span class="token operator">></span> <span class="token function">Run</span><span class="token punctuation">(</span>HttpRequestMessage req<span class="token punctuation">,</span> TraceWriter log<span class="token punctuation">,</span> ExecutionContext context<span class="token punctuation">)</span>\n<span class="token punctuation">{</span>\n  <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token keyword">string</span><span class="token punctuation">.</span><span class="token function">IsNullOrEmpty</span><span class="token punctuation">(</span>_functionDirectory<span class="token punctuation">)</span><span class="token punctuation">)</span>\n  <span class="token punctuation">{</span>\n    _functionDirectory <span class="token operator">=</span> context<span class="token punctuation">.</span>FunctionDirectory<span class="token punctuation">;</span>\n    <span class="token keyword">var</span> finfo <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">FileInfo</span><span class="token punctuation">(</span>$<span class="token string">"{_functionDirectory}\\\\Log4Net.config"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n    log4net<span class="token punctuation">.</span>Config<span class="token punctuation">.</span>XmlConfigurator<span class="token punctuation">.</span><span class="token function">ConfigureAndWatch</span><span class="token punctuation">(</span>finfo<span class="token punctuation">)</span><span class="token punctuation">;</span>\n  <span class="token punctuation">}</span>\n  <span class="token comment">// ...</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p>We first get the function directory from the <code class="language-text">ExecutionContext</code> and then we load the configuration from our file.\nAs discussed above, functions are only semi-stateless so once we have loaded the configuration, there is no need to re-read the file until the app domain gets reloaded.</p>\n<p>Now create an adapter for the logging interface of our choice.\nThe adapter interface can be Microsoft’s ILogger, or log4net’s ILog, or whatever interface you have chosen for the rest of your stack.\nAn example implementation using the log4net ILog interface <a href="https://github.com/jaredcnance/AzureFunctionsLogging/blob/master/AzureFunctionsLogging/Log4net/ILogTraceWriterAdapter.cs">is here</a>.</p>\n<p>You may notice that we need to have a type definition to create our logger.\nThe logging adapter needs to know the type that will be receiving the adapter instance.\nIn exceptionally simple functions, you can keep it simple and manually construct your dependency graph on invocation:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">var</span> logger <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ILogTraceWriterAdapter</span><span class="token punctuation">(</span><span class="token keyword">typeof</span><span class="token punctuation">(</span>Function<span class="token punctuation">)</span><span class="token punctuation">,</span> log<span class="token punctuation">)</span><span class="token punctuation">;</span>\n<span class="token keyword">var</span> processor <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">FunctionProcessor</span><span class="token punctuation">(</span>logger<span class="token punctuation">)</span><span class="token punctuation">;</span>\nprocessor<span class="token punctuation">.</span><span class="token function">Process</span><span class="token punctuation">(</span>body<span class="token punctuation">)</span><span class="token punctuation">;</span>\n</code></pre>\n      </div>\n<h3>Injecting the Logger</h3>\n<p>However, for more complex applications, you can use <a href="http://stackify.com/net-core-dependency-injection/">dependency injection</a> (DI) to handle injection of your logger.\nSince the Azure Functions runtime <a href="https://github.com/Azure/azure-webjobs-sdk-script/blob/bac0a62e9a4f844c95dd2ffbbd5702cd5cab30d0/src/WebJobs.Script.WebHost/WebJobs.Script.WebHost.csproj#L35">ships with Autofac</a>\nincluded, it makes sense for us to use that as the DI framework.\nAutofac provides dynamic component resolution hooks so that we can provide the type definition to the consuming logger.\n<a href="https://github.com/jaredcnance/AzureFunctionsLogging/blob/master/AzureFunctionsLogging/Log4net/TraceWriterLoggingModule.cs">In the example</a>, I do the following:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">private</span> <span class="token keyword">void</span> <span class="token function">OnComponentPreparing</span><span class="token punctuation">(</span><span class="token keyword">object</span> sender<span class="token punctuation">,</span> PreparingEventArgs e<span class="token punctuation">)</span>\n<span class="token punctuation">{</span>\n  e<span class="token punctuation">.</span>Parameters <span class="token operator">=</span> e<span class="token punctuation">.</span>Parameters<span class="token punctuation">.</span><span class="token function">Union</span><span class="token punctuation">(</span><span class="token keyword">new</span><span class="token punctuation">[</span><span class="token punctuation">]</span> <span class="token punctuation">{</span>\n    <span class="token keyword">new</span> <span class="token class-name">ResolvedParameter</span><span class="token punctuation">(</span>\n      <span class="token punctuation">(</span>p<span class="token punctuation">,</span> i<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">></span> p<span class="token punctuation">.</span>ParameterType <span class="token operator">==</span> <span class="token keyword">typeof</span><span class="token punctuation">(</span>ILog<span class="token punctuation">)</span><span class="token punctuation">,</span>\n      <span class="token punctuation">(</span>p<span class="token punctuation">,</span> i<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">></span> <span class="token keyword">new</span> <span class="token class-name">ILogTraceWriterAdapter</span><span class="token punctuation">(</span>p<span class="token punctuation">.</span>Member<span class="token punctuation">.</span>DeclaringType<span class="token punctuation">,</span> e<span class="token punctuation">.</span>Context<span class="token punctuation">.</span><span class="token generic-method function">Resolve<span class="token punctuation">&lt;</span>TraceWriter<span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span>\n    <span class="token punctuation">)</span><span class="token punctuation">,</span>\n  <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p>Any service that is resolved from the Autofac container and requires an implementation of <code class="language-text">ILog</code> will receive an instance of <code class="language-text">ILogTraceWriterAdapter</code>.\nAutofac constructs the adapter using the requesting type and registered <code class="language-text">TraceWriter</code> instance.\nWe also need to create a container and register our instances to that container:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">var</span> builder <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ContainerBuilder</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\nbuilder<span class="token punctuation">.</span><span class="token generic-method function">RegisterModule<span class="token punctuation">&lt;</span>TraceWriterLoggingModule<span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\nbuilder<span class="token punctuation">.</span><span class="token generic-method function">RegisterType<span class="token punctuation">&lt;</span>FunctionProcessor<span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n<span class="token keyword">var</span> container <span class="token operator">=</span> builder<span class="token punctuation">.</span><span class="token function">Build</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n</code></pre>\n      </div>\n<p>Now add the <code class="language-text">TraceWriter</code> to the container by <a href="https://github.com/jaredcnance/AzureFunctionsLogging/blob/master/AzureFunctionsLogging/Log4net/Function.cs#L23-L27">creating a scope</a>:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">using</span> <span class="token punctuation">(</span><span class="token keyword">var</span> scope <span class="token operator">=</span> _serviceProvider<span class="token punctuation">.</span><span class="token function">BeginLifetimeScope</span><span class="token punctuation">(</span>b <span class="token operator">=</span><span class="token operator">></span> b<span class="token punctuation">.</span><span class="token function">RegisterInstance</span><span class="token punctuation">(</span>log<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span>\n<span class="token punctuation">{</span>\n  <span class="token keyword">var</span> processor <span class="token operator">=</span> scope<span class="token punctuation">.</span><span class="token generic-method function">Resolve<span class="token punctuation">&lt;</span>FunctionProcessor<span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n  processor<span class="token punctuation">.</span><span class="token function">Process</span><span class="token punctuation">(</span>body<span class="token punctuation">)</span><span class="token punctuation">;</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<h2>Serilog</h2>\n<p>Luckily, in the case of Serilog, there is already a sink\n(<a href="https://github.com/StarRez/Serilog.Sinks.AzureWebJobsTraceWriter">Serilog.Sinks.AzureWebJobsTraceWriter</a>) built exactly for this purpose.</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">using</span> Serilog<span class="token punctuation">.</span>Sinks<span class="token punctuation">.</span>AzureWebJobsTraceWriter<span class="token punctuation">;</span>\n\n<span class="token keyword">var</span> log <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">LoggerConfiguration</span><span class="token punctuation">(</span><span class="token punctuation">)</span>\n <span class="token punctuation">.</span>WriteTo<span class="token punctuation">.</span><span class="token function">TraceWriter</span><span class="token punctuation">(</span>traceWriter<span class="token punctuation">)</span>\n <span class="token punctuation">.</span><span class="token function">CreateLogger</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n\nlog<span class="token punctuation">.</span><span class="token function">Warning</span><span class="token punctuation">(</span><span class="token string">"This will be written to the TraceWriter"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n</code></pre>\n      </div>\n<p>You can then inject the log instance into the scope in the same way that I demonstrated above with log4net.</p>\n<h2>Other Providers</h2>\n<p>While there are many other logging providers that are not covered here,\nI believe that I have equipped you with the tools that you will need to implement logging for the other providers.</p>\n<h2>Stackify</h2>\n<p>If you would like to ship your Azure Functions logs to Stackify (and we hope you do!), we recommend using one of our extensions to the major logging frameworks.\nAlso, the <a href="https://github.com/jaredcnance/AzureFunctionsLogging/blob/dee58c441216778a2ed205d1aebcaeb9334708bd/AzureFunctionsLogging/">demo repository</a>\nprovides examples for shipping log4net and Serilog logs to Stackify.</p>\n<blockquote>\n<p>Tip: When you are hacking around with a new app and trying to send logs to Stackify, try\nfiltering down to the function app and use the log tailing feature so you can see the logs as they are processed by Stackify.</p>\n</blockquote>\n<h3>Configuration</h3>\n<p>I used the <a href="https://github.com/jaredcnance/AzureFunctionsLogging/blob/dee58c441216778a2ed205d1aebcaeb9334708bd/AzureFunctionsLogging/AzureFunctionsLogging.csproj#L12-L13">Microsoft.Extenstions.Configuration</a>\npackages to <a href="https://github.com/jaredcnance/AzureFunctionsLogging/blob/dee58c441216778a2ed205d1aebcaeb9334708bd/AzureFunctionsLogging/Log4net/ServiceProvider.cs#L10-L16">load configuration</a>\nfrom environment variables and pass them to the <a href="https://github.com/stackify/stackify-api-dotnet">Stackify library</a>:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">private</span> <span class="token keyword">static</span> <span class="token keyword">readonly</span> IConfigurationRoot _config <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ConfigurationBuilder</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">AddEnvironmentVariables</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">Build</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n<span class="token keyword">static</span> <span class="token function">Function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>\n  _config<span class="token punctuation">.</span><span class="token function">ConfigureStackify</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p>Configuration from <code class="language-text">local.settings.json</code> will be available during development. For deployed functions, you can apply settings through the portal:</p>\n<p>Configuration from local.settings.json will be available during development. For deployed functions, you can apply settings through the portal.</p>\n<p>\n  <a\n    class="gatsby-resp-image-link"\n    href="/static/settings-1-9a8903f0f3def743b6b0a77a5f370a4b-58f95.png"\n    style="display: block"\n    target="_blank"\n    rel="noopener"\n  >\n  \n  <span\n    class="gatsby-resp-image-wrapper"\n    style="position: relative; display: block; ; max-width: 590px; margin-left: auto; margin-right: auto;"\n  >\n    <span\n      class="gatsby-resp-image-background-image"\n      style="padding-bottom: 56.16264294790343%; position: relative; bottom: 0; left: 0; background-image: url(\'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAALCAYAAAB/Ca1DAAAACXBIWXMAAAsSAAALEgHS3X78AAAA90lEQVQoz52T246EIBBE/f8/1MQXZ3WNIncYb1AD7brzqpIcoE0oiupYtG2LqqpQ1zWa5pVoUJYluq5DHjHGWxScc/R9j2maIIQghmGg+hS8M4pzs4dAhJBvAkKatn2nOtD3axR5UkpjnDgmLgjOJViq3/NMDkk0XiM5jLDWHUJCQipFq3XucPrn+iqFkwukNNDGQOm8Wnj/xrwsX3d3BMfGYhwEVBIUUsEkt2cz7oqRIPtxYIMkQZmyzM/9ZhceOHxZsFH9C0pl4Lw/Ov7kyfzXgzOZstOpORbO2ZSlxrpuzzLMh7Rbwc0C4zcwNcPPO+UYbv4lmQ8f8F6BWxRh0wAAAABJRU5ErkJggg==\'); background-size: cover; display: block;"\n    >\n      <img\n        class="gatsby-resp-image-image"\n        style="width: 100%; height: 100%; margin: 0; vertical-align: middle; position: absolute; top: 0; left: 0; box-shadow: inset 0px 0px 0px 400px white;"\n        alt="settings 1"\n        title=""\n        src="/static/settings-1-9a8903f0f3def743b6b0a77a5f370a4b-fb8a0.png"\n        srcset="/static/settings-1-9a8903f0f3def743b6b0a77a5f370a4b-1a291.png 148w,\n/static/settings-1-9a8903f0f3def743b6b0a77a5f370a4b-2bc4a.png 295w,\n/static/settings-1-9a8903f0f3def743b6b0a77a5f370a4b-fb8a0.png 590w,\n/static/settings-1-9a8903f0f3def743b6b0a77a5f370a4b-58f95.png 787w"\n        sizes="(max-width: 590px) 100vw, 590px"\n      />\n    </span>\n  </span>\n  \n  </a>\n    </p>\n<h2>Future</h2>\n<p>Whatever solution that you choose (at this time) will contain some temporary stopgap measure(s) until there is a formalized solution for dependency injection.\nThis may involve some effort to reuse prior art introduced in ASP.NET Core. Until then, we’ll be tracking the progress at\n<a href="https://github.com/Azure/azure-webjobs-sdk-script/issues/1579">Azure/azure-webjobs-sdk-script#1579</a>.</p>\n<p>The best advice that I can give at this point is to ensure that your service code is dependent on the <code class="language-text">ILogger</code> interface or some other abstraction that you may define,\nbut not <code class="language-text">TraceWriter</code> . Eventually we should be able to pull back the adapters introduced above and use a proper DI-based logging solution.</p>\n<h2>Possible Issues</h2>\n<ul>\n<li>\n<p>“Exception while executing function: Functions.log4net -> Exception binding parameter ‘log’ -> No value was provided for parameter ‘log’.”</p>\n</li>\n<li>\n<p>This can be caused by a version mismatch.\nThe function runtime is bringing in Microsoft.Extensions.Logging at v1.1.1\nand you may be referencing a different version.</p>\n</li>\n<li>\n<p>You may run into an issue accepting ILogger as a function method parameter\nthat causes log messages to not be displayed in the console when running the\nfunction locally using func.exe. As of the writing of this post, there has yet\nto be any resolution <a href="https://github.com/Azure/azure-functions-cli/issues/130">from the Azure Functions team</a>.</p>\n</li>\n<li>\n<p>Depending on which version of func.exe you are running,\nyou may run into issues trying to use the pre-release (3.0.0-<em>)\nMicrosoft.Azure.WebJobs.</em> packages.\nFor example, I’m running Azure Functions Core Tools (1.0.4)\nand Function Runtime Version: 1.0.11232.0, which references\nMicrosoft.Azure.WebJobs 2.1.0. Since <a href="https://github.com/Azure/azure-webjobs-sdk-script/issues/992">binding redirects are still unsupported</a>,\nthis means there will be runtime type errors when trying to reference types in the pre-release version.</p>\n</li>\n</ul>\n<h2>Resources</h2>\n<ul>\n<li><a href="https://github.com/Azure/azure-webjobs-sdk-script/wiki/Precompiled-functions">Pre-compiled Azure functions</a></li>\n<li><a href="http://stackify.com/net-core-dependency-injection/">Dependency injection</a></li>\n</ul>\n<h2>GitHub Issues To Watch</h2>\n<ul>\n<li><a href="https://github.com/Azure/azure-webjobs-sdk-script/issues/992">Binding redirect support</a></li>\n<li><a href="https://github.com/Azure/azure-webjobs-sdk-script/issues/1579">Allow custom dependency injection</a></li>\n<li><a href="https://github.com/Azure/azure-functions-cli/issues/130">Logging written to ILogger does not appear in the CLI</a></li>\n<li><a href="https://github.com/Azure/azure-webjobs-sdk/issues/1390">In-memory integration testing of Azure functions</a></li>\n</ul>',frontmatter:{title:"A Guide to Logging in Azure Functions",date:"December 05, 2017",description:null}}},pathContext:{slug:"/logging-in-azure-functions/",previous:{fields:{slug:"/dotnet-core-dependency-injection/"},frontmatter:{title:".Net Core Dependency Injection"}},next:{fields:{slug:"/dotnet-performance-optimization/"},frontmatter:{title:"A Strategy for the Measurement and Optimization of .NET Application Performance"}}}}}});
//# sourceMappingURL=path---logging-in-azure-functions-c2dd920db5b4cfee9635.js.map