webpackJsonp([68384136547871],{515:function(n,s){n.exports={data:{site:{siteMetadata:{title:"nance.io",author:"Jared Nance"}},markdownRemark:{id:"/Users/jarednance/dev/gatsby-blog/src/pages/dotnet-core-dependency-injection/index.md absPath of file >>> MarkdownRemark",html:'<blockquote>\n<p>This is a cross-post from <a href="https://stackify.com/net-core-dependency-injection">stackify.com</a></p>\n</blockquote>\n<h2>What is Dependency Injection?</h2>\n<p><a href="https://www.martinfowler.com/articles/injection.html">Dependency Injection</a> (DI) is a pattern that can help developers decouple the different pieces of their applications. It provides a mechanism for the construction of dependency graphs independent of the class definitions. Throughout this article, I will be focusing on <a href="https://en.wikipedia.org/wiki/Dependency_injection#Constructor_injection">constructor injection</a> where dependencies are provided to consumers through their constructors. Consider the following classes:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">class</span> <span class="token class-name">Bar</span> <span class="token punctuation">:</span> IBar <span class="token punctuation">{</span>\n  <span class="token comment">// ...</span>\n<span class="token punctuation">}</span>\n\n<span class="token keyword">class</span> <span class="token class-name">Foo</span> <span class="token punctuation">{</span>\n  <span class="token keyword">private</span> <span class="token keyword">readonly</span> IBar _bar<span class="token punctuation">;</span>\n  <span class="token keyword">public</span> <span class="token function">Foo</span><span class="token punctuation">(</span>IBar bar<span class="token punctuation">)</span> <span class="token punctuation">{</span>\n    _bar <span class="token operator">=</span> bar<span class="token punctuation">;</span>\n  <span class="token punctuation">}</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p>In this example, <code class="language-text">Foo</code> depends on <code class="language-text">IBar</code> and somewhere we’ll have to construct an instance of Foo and specify that it depends on the implementation <code class="language-text">Bar</code> like so:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">var</span> bar <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Bar</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n<span class="token keyword">var</span> foo <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Foo</span><span class="token punctuation">(</span>bar<span class="token punctuation">)</span><span class="token punctuation">;</span>\n</code></pre>\n      </div>\n<p>The problem with this is two-fold. Firstly, it violates the <a href="https://en.wikipedia.org/wiki/Dependency_inversion_principle">Dependency Inversion Principle</a> because the consuming class <a href="http://deviq.com/explicit-dependencies-principle/">implicitly depends</a> on the concrete types <code class="language-text">Bar</code> and <code class="language-text">Foo</code>. Secondly, it results in a scattered definition of the dependency graph and can make unit testing very difficult.</p>\n<p>The <a href="http://blog.ploeh.dk/2011/07/28/CompositionRoot/">Composition Root</a> pattern states that the entire dependency graph should be composed in a single location “as close as possible to the application’s entry point”. This could get pretty messy without the assistance of a framework. DI frameworks provide a mechanism, often referred to as an Inversion of Control (IoC) Container, for offloading the instantiation, injection, and lifetime management of dependencies to the framework. You invert the control of component instantiation from the consumers to the container, hence “Inversion of Control”.</p>\n<p>To do this, you simply register services with a container, and then you can load the top level service. The framework will inject all child services for you. A simple example, based on the class definitions above, might look like:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp">container<span class="token punctuation">.</span><span class="token generic-method function">Register<span class="token punctuation">&lt;</span>Bar<span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token generic-method function">As<span class="token punctuation">&lt;</span>IBar<span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\ncontainer<span class="token punctuation">.</span><span class="token generic-method function">Register<span class="token punctuation">&lt;</span>Foo<span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n<span class="token comment">// per the Composition Root pattern, this _should_ be the only lookup on the container</span>\n<span class="token keyword">var</span> foo <span class="token operator">=</span> container<span class="token punctuation">.</span><span class="token generic-method function">Get<span class="token punctuation">&lt;</span>Foo<span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n</code></pre>\n      </div>\n<h2>Dependency Injection in ASP.Net Core</h2>\n<p>Prior to <a href="http://stackify.com/net-core-2-0-changes/">.Net Core</a>, the only way to get DI in your applications was through the use of a framework such as <a href="https://autofac.org/">Autofac</a>, <a href="http://www.ninject.org/">Ninject</a>, <a href="https://structuremap.github.io/">StructureMap</a> and <a href="https://github.com/danielpalme/IocPerformance">many others</a>. However, DI is treated as a <a href="https://docs.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection">first-class citizen</a> in ASP.Net Core. You can configure your container in your <code class="language-text">Startup.ConfigureServices</code> method:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">Startup</span> <span class="token punctuation">{</span>\n  <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">ConfigureServices</span><span class="token punctuation">(</span>IServiceCollection services<span class="token punctuation">)</span> <span class="token punctuation">{</span>\n    services<span class="token punctuation">.</span><span class="token generic-method function">AddTransient<span class="token punctuation">&lt;</span>IArticleService<span class="token punctuation">,</span> ArticleService<span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n  <span class="token punctuation">}</span>\n  <span class="token comment">// ...</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p>When a request gets routed to your controller, it will be <a href="https://github.com/aspnet/Mvc/blob/eeac99985a61e75ca48e620f0371e16df018d6d7/src/Microsoft.AspNetCore.Mvc.Core/Controllers/ServiceBasedControllerActivator.cs#L16-L26">resolved from the container</a> along with all its dependencies:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">ArticlesController</span> <span class="token punctuation">:</span> Controller <span class="token punctuation">{</span>\n  <span class="token keyword">private</span> <span class="token keyword">readonly</span> IArticleService _articleService<span class="token punctuation">;</span>\n  <span class="token keyword">public</span> <span class="token function">ArticlesController</span><span class="token punctuation">(</span>IArticleService articleService<span class="token punctuation">)</span> <span class="token punctuation">{</span>\n    _articleService <span class="token operator">=</span> articleService<span class="token punctuation">;</span>\n  <span class="token punctuation">}</span>\n\n  <span class="token punctuation">[</span><span class="token function">HttpGet</span><span class="token punctuation">(</span><span class="token string">"{id}"</span><span class="token punctuation">]</span>\n  <span class="token keyword">public</span> <span class="token keyword">async</span> Task<span class="token operator">&lt;</span>IActionResult<span class="token operator">></span> <span class="token function">GetAsync</span><span class="token punctuation">(</span><span class="token keyword">int</span> id<span class="token punctuation">)</span> <span class="token punctuation">{</span>\n    <span class="token keyword">var</span> article <span class="token operator">=</span> <span class="token keyword">await</span> _articleService<span class="token punctuation">.</span><span class="token function">GetAsync</span><span class="token punctuation">(</span>id<span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token keyword">if</span><span class="token punctuation">(</span>article <span class="token operator">==</span> <span class="token keyword">null</span><span class="token punctuation">)</span>\n      <span class="token keyword">return</span> <span class="token function">NotFound</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token keyword">return</span> <span class="token function">Ok</span><span class="token punctuation">(</span>article<span class="token punctuation">)</span><span class="token punctuation">;</span>\n  <span class="token punctuation">}</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<h3>Dependency Lifetimes</h3>\n<p>At registration time, dependencies require a lifetime definition. The service lifetime defines the conditions under which a new service instance will be created. Below are the lifetimes defined by the ASP.Net DI framework. The terminology may be different if you choose to use a different framework.</p>\n<ul>\n<li><strong>Transient</strong> – Created every time they are requested</li>\n<li><strong>Scoped</strong> – Created once per scope. Most of the time, scope refers to a web request. But this can also be used for any unit of work, such as the execution of an Azure Function.</li>\n<li><strong>Singleton</strong> – Created only for the first request. If a particular instance is specified at registration time, this instance will be provided to all consumers of the registration type.</li>\n</ul>\n<h3>Using Different Providers</h3>\n<p>If you would like to use a more mature DI framework, you can do so as long as they provide an <a href="https://github.com/dotnet/corefx/blob/c6dbe361680efd21a20fdb8def01936b1031011c/src/System.ComponentModel/src/System/IServiceProvider.cs#L7-L10">IServiceProvider</a> implementation. If they don’t provide one, it is a very <a href="https://github.com/dotnet/corefx/blob/c6dbe361680efd21a20fdb8def01936b1031011c/src/System.ComponentModel/src/System/IServiceProvider.cs#L7-L10">simple interface</a> that you should be able to implement yourself. You would just return an instance of the container in your ConfigureServices method. Here is an example using <a href="https://www.nuget.org/packages/Autofac/4.6.1">Autofac</a>:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">Startup</span> <span class="token punctuation">{</span>\n  <span class="token keyword">public</span> IServiceProvider <span class="token function">ConfigureServices</span><span class="token punctuation">(</span>IServiceCollection services<span class="token punctuation">)</span> <span class="token punctuation">{</span>\n    <span class="token comment">// setup the Autofac container</span>\n    <span class="token keyword">var</span> builder <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ContainerBuilder</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n    builder<span class="token punctuation">.</span><span class="token function">Populate</span><span class="token punctuation">(</span>services<span class="token punctuation">)</span><span class="token punctuation">;</span>\n    builder<span class="token punctuation">.</span><span class="token generic-method function">RegisterType<span class="token punctuation">&lt;</span>ArticleService<span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token generic-method function">As<span class="token punctuation">&lt;</span>IArticleService<span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token keyword">var</span> container <span class="token operator">=</span> builder<span class="token punctuation">.</span><span class="token function">Build</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token comment">// return the IServiceProvider implementation</span>\n    <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">AutofacServiceProvider</span><span class="token punctuation">(</span>container<span class="token punctuation">)</span><span class="token punctuation">;</span>\n  <span class="token punctuation">}</span>\n  <span class="token comment">// ...</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<h3>Generics</h3>\n<p>Dependency injection can get really interesting when you start working with generics. Most DI providers allow you to register <a href="https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/types">open generic types</a> that will have their generic arguments set based on the requested generic type arguments. A great example of this is Microsoft’s new logging framework (Microsoft.Extensions.Logging). If you look <a href="https://github.com/aspnet/Logging/blob/af314d54058389c8685dbaeb360c9aa9caea0af5/src/Microsoft.Extensions.Logging/LoggingServiceCollectionExtensions.cs#L42">under the hood</a> you can see how they inject the open generic <code class="language-text">ILogger&lt;&gt;</code>:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp">services<span class="token punctuation">.</span><span class="token function">TryAdd</span><span class="token punctuation">(</span>ServiceDescriptor<span class="token punctuation">.</span><span class="token function">Singleton</span><span class="token punctuation">(</span><span class="token keyword">typeof</span><span class="token punctuation">(</span>ILogger<span class="token operator">&lt;</span><span class="token operator">></span><span class="token punctuation">)</span><span class="token punctuation">,</span> <span class="token keyword">typeof</span><span class="token punctuation">(</span>Logger<span class="token operator">&lt;</span><span class="token operator">></span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n</code></pre>\n      </div>\n<p>This allows you to depend on the generic <code class="language-text">ILogger&lt;&gt;</code> like so:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">Foo</span> <span class="token punctuation">{</span>\n  <span class="token keyword">public</span> <span class="token function">Foo</span><span class="token punctuation">(</span>ILogger<span class="token operator">&lt;</span>Foo<span class="token operator">></span> logger<span class="token punctuation">)</span> <span class="token punctuation">{</span>\n    logger<span class="token punctuation">.</span><span class="token function">LogInformation</span><span class="token punctuation">(</span><span class="token string">"Constructed!!!"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n  <span class="token punctuation">}</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p>Another common use case is the <a href="https://cpratt.co/truly-generic-repository/">Generic Repository Pattern</a>. Some consider this an <a href="https://www.infoworld.com/article/3117713/application-development/design-patterns-that-i-often-avoid-repository-pattern.html">anti-pattern</a> when used with an ORM like Entity Framework because it already implements the Repository Pattern. But, if you’re unfamiliar with DI and generics, I think it provides an easy entry point.</p>\n<p>Open generic injection also provides a great mechanism for libraries (such as <a href="https://github.com/json-api-dotnet/JsonApiDotNetCore">JsonApiDotNetCore</a>) to offer default behaviors with easy extensibility for applications. Suppose a framework provides an out-of-the-box, implementation of the generic repository pattern. It may have an interface that looks like this, implemented by a <code class="language-text">GenericRepository</code>:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">public</span> <span class="token keyword">interface</span> <span class="token class-name">IRepository</span><span class="token operator">&lt;</span>T<span class="token operator">></span> <span class="token keyword">where</span> T <span class="token punctuation">:</span> IIdentifiable <span class="token punctuation">{</span>\n   T <span class="token function">Get</span><span class="token punctuation">(</span><span class="token keyword">int</span> id<span class="token punctuation">)</span><span class="token punctuation">;</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p>The library would provide some <code class="language-text">IServiceCollection</code> extension method like:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">void</span> <span class="token function">AddDefaultRepositories</span><span class="token punctuation">(</span><span class="token keyword">this</span> IServiceCollection services<span class="token punctuation">)</span> <span class="token punctuation">{</span>\n  services<span class="token punctuation">.</span><span class="token function">TryAdd</span><span class="token punctuation">(</span>ServiceDescriptor<span class="token punctuation">.</span><span class="token function">Scoped</span><span class="token punctuation">(</span><span class="token keyword">typeof</span><span class="token punctuation">(</span>IRepository<span class="token operator">&lt;</span><span class="token operator">></span><span class="token punctuation">)</span><span class="token punctuation">,</span> <span class="token keyword">typeof</span><span class="token punctuation">(</span>GenericRepository<span class="token operator">&lt;</span><span class="token operator">></span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p>And the default behavior could be supplemented by the application on a per resource basis by injecting a more specific type:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp">services<span class="token punctuation">.</span>AddScoped<span class="token operator">&lt;</span>IRepository<span class="token operator">&lt;</span>Foo<span class="token operator">></span><span class="token punctuation">,</span> FooRepository<span class="token operator">></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n</code></pre>\n      </div>\n<p>And of course <code class="language-text">FooRepository</code> can inherit from <code class="language-text">GenericRepository&lt;&gt;</code>.</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">class</span> <span class="token class-name">FooRepository</span> <span class="token punctuation">:</span> GenericRepository<span class="token operator">&lt;</span>Foo<span class="token operator">></span> <span class="token punctuation">{</span>\n  Foo <span class="token function">Get</span><span class="token punctuation">(</span><span class="token keyword">int</span> id<span class="token punctuation">)</span> <span class="token punctuation">{</span>\n    <span class="token keyword">var</span> foo <span class="token operator">=</span> <span class="token keyword">base</span><span class="token punctuation">.</span><span class="token function">Get</span><span class="token punctuation">(</span>id<span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token comment">// ...authorization of resources or any other application concerns can go here</span>\n    <span class="token keyword">return</span> foo<span class="token punctuation">;</span>\n  <span class="token punctuation">}</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<h2>Beyond the Web</h2>\n<p>The ASP.Net team has separated their DI framework from the ASP.Net packages into <a href="https://www.nuget.org/packages/Microsoft.Extensions.DependencyInjection/">Microsoft.Extensions.DependencyInjection</a>. What this means is that you are not limited to web apps and can leverage these new libraries in event-driven apps (such as Azure Functions and AWS Lambda) or in thread loop apps. All you need to do is:</p>\n<ol>\n<li>Install the framework NuGet package:</li>\n</ol>\n<div class="gatsby-highlight">\n      <pre class="language-text"><code class="language-text">Install-Package Microsoft.Extensions.DependencyInjection</code></pre>\n      </div>\n<p>or</p>\n<div class="gatsby-highlight">\n      <pre class="language-text"><code class="language-text">dotnet add package Microsoft.Extensions.DependencyInjection</code></pre>\n      </div>\n<ol start="2">\n<li>Register your dependencies on a static container:</li>\n</ol>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">var</span> serviceCollection <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ServiceCollection</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\nserviceCollection<span class="token punctuation">.</span><span class="token generic-method function">AddScoped<span class="token punctuation">&lt;</span>IEmailSender<span class="token punctuation">,</span> AuthMessageSender<span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\nserviceCollection<span class="token punctuation">.</span><span class="token generic-method function">AddScoped<span class="token punctuation">&lt;</span>AzureFunctionEventProcessor<span class="token punctuation">,</span> IEventProcessor<span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\nContainer <span class="token operator">=</span> serviceCollection<span class="token punctuation">.</span><span class="token function">BuildServiceProvider</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n</code></pre>\n      </div>\n<ol start="3">\n<li>Define the lifetime scope (if applicable) and resolve your top level dependency:</li>\n</ol>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">var</span> serviceScopeFactory <span class="token operator">=</span> Container<span class="token punctuation">.</span><span class="token generic-method function">GetRequiredService<span class="token punctuation">&lt;</span>IServiceScopeFactory<span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n<span class="token keyword">using</span> <span class="token punctuation">(</span><span class="token keyword">var</span> scope <span class="token operator">=</span> serviceScopeFactory<span class="token punctuation">.</span><span class="token function">CreateScope</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span>\n<span class="token punctuation">{</span>\n  <span class="token keyword">var</span> processor <span class="token operator">=</span> scope<span class="token punctuation">.</span>ServiceProvider<span class="token punctuation">.</span><span class="token generic-method function">GetService<span class="token punctuation">&lt;</span>IEventProcessor<span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n  processor<span class="token punctuation">.</span><span class="token function">Handle</span><span class="token punctuation">(</span>theEvent<span class="token punctuation">)</span><span class="token punctuation">;</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p><a href="https://github.com/aspnet/DependencyInjection/blob/06e2de235ce5b27b425e823d9dcbd045811ba48e/src/DI/ServiceLookup/ServiceProviderEngine.cs#L26">Under the hood</a>, the call to <code class="language-text">.BuildServiceProvider()</code> will inject an <a href="https://github.com/aspnet/DependencyInjection/blob/d5e5aa703297b164b21ba4ad3fdff81c854ce009/src/DI.Abstractions/IServiceScopeFactory.cs#L10"><code class="language-text">IServiceScopeFactory</code></a>. You can load this service and define a scope so you can use properly scoped services.</p>\n<h3>Disposable Services</h3>\n<p>If a registered service implements <code class="language-text">IDisposable</code> it will be disposed of when the containing scope is disposed. You can see how this is done here. For this reason, it is important to always resolve services from a scope and not the root container, as described above. If you resolve <code class="language-text">IDisposable</code>s from the root container, you may create a memory leak since these services will not be disposed of until the container gets disposed.</p>\n<h3>Dynamic Service Resolution</h3>\n<p>Some DI providers provide resolution time hooks that allow you to make runtime decisions about dependency injection. For example, Autofac provides an <a href="https://autofac.org/apidoc/html/DB09DDBB.htm"><code class="language-text">AttachToComponentRegistration</code></a> method that can be used to make runtime decisions. At Stackify, we used this with <a href="http://stackify.com/azure-functions-performance-monitoring-retrace/">Azure Functions</a> to wrap the <a href="https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-csharp#logging">TraceWriter</a> (before they <a href="https://github.com/Azure/Azure-Functions/issues/293">supported the ILogger interface</a>) behind a facade. This facade passed the logging method calls to the scoped <code class="language-text">TraceWriter</code> instance as well as our log4net logger. To do this, we register the instance of the <code class="language-text">TraceWriter</code> when we begin the lifetime scope:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">using</span> <span class="token punctuation">(</span><span class="token keyword">var</span> scope <span class="token operator">=</span> ServiceProvider<span class="token punctuation">.</span><span class="token function">BeginLifetimeScope</span><span class="token punctuation">(</span>b <span class="token operator">=</span><span class="token operator">></span> b<span class="token punctuation">.</span><span class="token function">RegisterInstance</span><span class="token punctuation">(</span>traceWriter<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">)</span>\n<span class="token punctuation">{</span>\n  <span class="token comment">// ...</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p>I’ve <a href="https://gist.github.com/jaredcnance/45f5e7d367a02375c588087160e8f126">created a gist here</a> that you can reference if you’d like to see the rest of the implementation.</p>\n<h3>When Not To Use IoC Containers</h3>\n<p>In general, IoC containers are an application concern. What this means is library and framework authors should think carefully about whether or not it is really necessary to create an IoC container within the package itself. An example of one that does this is the AspNetCore.Mvc framework packages. However, this framework is intended to manage the life of the application itself. This is very different than say a logging framework.</p>\n<h2>Conclusion</h2>\n<p>Dependency Injection describes the pattern of passing dependencies to consuming services at instantiation. DI frameworks provide IoC containers that allow developers to offload control of this process to the framework. This lets us decouple our modules from their concrete dependencies, improving <a href="http://stackify.com/fundamentals-web-application-performance-testing/">testability</a> and extensibility of our applications.</p>\n<blockquote>\n<p>Note\nAll of the source code links used in this article are permalinks to the code on the default repository branches. These links should be used as a reference and not as the current state of the underlying implementations or APIs since these are subject to change at any time</p>\n</blockquote>',frontmatter:{title:".Net Core Dependency Injection",date:"October 16, 2017",description:null}}},pathContext:{slug:"/dotnet-core-dependency-injection/",previous:{fields:{slug:"/typescript-vs-javascript/"},frontmatter:{title:"TypeScript vs JavaScript"}},next:{fields:{slug:"/logging-in-azure-functions/"},frontmatter:{title:"A Guide to Logging in Azure Functions"}}}}}
});
//# sourceMappingURL=path---dotnet-core-dependency-injection-57709773b4c081d4b60d.js.map