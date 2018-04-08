webpackJsonp([47572940128521],{516:function(n,s){n.exports={data:{site:{siteMetadata:{title:"nance.io",author:"Jared Nance"}},markdownRemark:{id:"/Users/jarednance/dev/gatsby-blog/src/pages/hangfire-tasks-in-dotnet-core/index.md absPath of file >>> MarkdownRemark",html:'<p>Follow along on <a href="https://github.com/jaredcnance/hangfire-dot-net-core-example">Github</a></p>\n<h2>Why?</h2>\n<p>Typically, when we think of an ideal RESTful service, it’s one that does very simple CRUD tasks.\nHowever, sometimes these tasks aren’t so simple and the reasons are out of our control.\nCurrently, I am required to build a service that is exposed to a vendor application and am constrained by the rules of that application.\nBecause of these constraints, creation of resources is a little more complicated. The basic requirements are:</p>\n<ul>\n<li>Expose an endpoint that the vendor application can use to POST information about a resource, but not the resource itself.</li>\n<li>The application needs to then perform additional tasks to get the information necessary to create the resource</li>\n<li>The vendor client requires a quick HTTP status code response otherwise it will time out.</li>\n</ul>\n<h2>The Solution: Asynchronous Background Processing With Hangfire</h2>\n<p><a href="http://hangfire.io/">Hangfire</a> seems to be the most popular, well maintained, and well documented background processor for .Net and with their recent <a href="https://github.com/HangfireIO/Hangfire/pull/604">upgrade to support .Net Core</a>, they seem like the best candidate.</p>\n<p>Hangfire is discussed in detail elsewhere and <a href="http://www.hanselman.com/blog/HowToRunBackgroundTasksInASPNET.aspx">Scott Hanselman</a> does an excellent job going over this exact topic.</p>\n<h2>Installation</h2>\n<p>If you are running an app on netcoreapp or netstandard, you should be able to install it just by running <code class="language-text">Install-Package Hangfire</code> in the Package Manager Console or by adding the following to your project.json dependencies and running <code class="language-text">dotnet restore</code>:</p>\n<div class="gatsby-highlight">\n      <pre class="language-text"><code class="language-text">&quot;Hangfire&quot;: &quot;1.6.2&quot;</code></pre>\n      </div>\n<p>However, if you are running against net451 (I am because I am waiting on other dependencies to be upgraded), you will need to add the following to your project.json:</p>\n<div class="gatsby-highlight">\n      <pre class="language-text"><code class="language-text">&quot;Hangfire.AspNetCore&quot;: &quot;1.6.2&quot;,\n&quot;Hangfire.SqlServer&quot;: &quot;1.6.2&quot; // only if you are using SQL Server as your backing data store</code></pre>\n      </div>\n<h2>Register the Services</h2>\n<p>In <code class="language-text">Startup.cs</code> add the following to <code class="language-text">ConfigureServices(...)</code>:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp">services<span class="token punctuation">.</span><span class="token function">AddHangfire</span><span class="token punctuation">(</span>config <span class="token operator">=</span><span class="token operator">></span>\n<span class="token punctuation">{</span>\n    config<span class="token punctuation">.</span><span class="token function">UseSqlServerStorage</span><span class="token punctuation">(</span>Configuration<span class="token punctuation">[</span><span class="token string">"Data:WorkQueue"</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n</code></pre>\n      </div>\n<p>Be sure to add the connections string to your sql server or LocalDb store in your <code class="language-text">appsettings.json</code> file.</p>\n<p>Add the HangfireServer to the request pipeline:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">Configure</span><span class="token punctuation">(</span>IApplicationBuilder app<span class="token punctuation">,</span> ILoggerFactory loggerFactory<span class="token punctuation">)</span>\n<span class="token punctuation">{</span>\n    loggerFactory<span class="token punctuation">.</span><span class="token function">AddConsole</span><span class="token punctuation">(</span>Configuration<span class="token punctuation">.</span><span class="token function">GetSection</span><span class="token punctuation">(</span><span class="token string">"Logging"</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n    loggerFactory<span class="token punctuation">.</span><span class="token function">AddDebug</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n    app<span class="token punctuation">.</span><span class="token function">UseHangfireServer</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n    app<span class="token punctuation">.</span><span class="token function">UseMvc</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<h2>Injecting Services</h2>\n<p>Hangfire provides a <a href="http://docs.hangfire.io/en/latest/background-methods/passing-dependencies.html">way to inject dependencies</a> and we can lean on .Net Core’s IServiceProvider as our dependency container.</p>\n<p>So, per the <a href="http://docs.hangfire.io/en/latest/background-methods/using-ioc-containers.html">documentation</a>, we can extend the Hangfire activator like so:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token comment">// ServiceProviderActivator.cs</span>\n\n<span class="token keyword">using</span> System<span class="token punctuation">;</span>\n<span class="token keyword">using</span> Hangfire<span class="token punctuation">;</span>\n\n<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">ServiceProviderActivator</span> <span class="token punctuation">:</span> JobActivator\n<span class="token punctuation">{</span>\n<span class="token keyword">private</span> <span class="token keyword">readonly</span> IServiceProvider _serviceProvider<span class="token punctuation">;</span>\n\n    <span class="token keyword">public</span> <span class="token function">ServiceProviderActivator</span><span class="token punctuation">(</span>IServiceProvider serviceProvider<span class="token punctuation">)</span>\n    <span class="token punctuation">{</span>\n        _serviceProvider <span class="token operator">=</span> serviceProvider<span class="token punctuation">;</span>\n    <span class="token punctuation">}</span>\n\n    <span class="token keyword">public</span> <span class="token keyword">override</span> <span class="token keyword">object</span> <span class="token function">ActivateJob</span><span class="token punctuation">(</span>Type type<span class="token punctuation">)</span>\n    <span class="token punctuation">{</span>\n        <span class="token keyword">return</span> _serviceProvider<span class="token punctuation">.</span><span class="token function">GetService</span><span class="token punctuation">(</span>type<span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token punctuation">}</span>\n\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p>Now, let’s create the service responsible for executing the long running task:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token comment">// Services/TodoItemService.cs</span>\n<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">TodoItemService</span> <span class="token punctuation">:</span> IDisposable\n<span class="token punctuation">{</span>\n    <span class="token keyword">private</span> <span class="token keyword">readonly</span> ApplicationDbContext _context<span class="token punctuation">;</span>\n\n    <span class="token keyword">public</span> <span class="token function">TodoItemService</span><span class="token punctuation">(</span>IConfigurationRoot configuration<span class="token punctuation">)</span>\n    <span class="token punctuation">{</span>\n        <span class="token comment">// create the context here to avoid access to a disposed context</span>\n        <span class="token keyword">var</span> dbContextOptionsBuilder <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">DbContextOptionsBuilder</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n        dbContextOptionsBuilder<span class="token punctuation">.</span><span class="token function">UseSqlServer</span><span class="token punctuation">(</span>configuration<span class="token punctuation">[</span><span class="token string">"Data:DefaultConnection"</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n        _context <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ApplicationDbContext</span><span class="token punctuation">(</span>dbContextOptionsBuilder<span class="token punctuation">.</span>Options<span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token punctuation">}</span>\n\n    <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">CreateTodoItem</span><span class="token punctuation">(</span>TodoItem todoItem<span class="token punctuation">)</span>\n    <span class="token punctuation">{</span>\n        Console<span class="token punctuation">.</span><span class="token function">WriteLine</span><span class="token punctuation">(</span><span class="token string">"Run started"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n        _context<span class="token punctuation">.</span>TodoItems<span class="token punctuation">.</span><span class="token function">Add</span><span class="token punctuation">(</span>todoItem<span class="token punctuation">)</span><span class="token punctuation">;</span>\n        _context<span class="token punctuation">.</span><span class="token function">SaveChanges</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n        Thread<span class="token punctuation">.</span><span class="token function">Sleep</span><span class="token punctuation">(</span><span class="token number">10000</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n        Console<span class="token punctuation">.</span><span class="token function">WriteLine</span><span class="token punctuation">(</span><span class="token string">"Run complete"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token punctuation">}</span>\n\n    <span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">Dispose</span><span class="token punctuation">(</span><span class="token punctuation">)</span>\n    <span class="token punctuation">{</span>\n        _context<span class="token punctuation">.</span><span class="token function">Dispose</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token punctuation">}</span>\n\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p>Then we can configure it in <code class="language-text">Startup.cs</code> like so:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">ConfigureServices</span><span class="token punctuation">(</span>IServiceCollection services<span class="token punctuation">)</span>\n<span class="token punctuation">{</span>\n    services<span class="token punctuation">.</span><span class="token generic-method function">AddDbContext<span class="token punctuation">&lt;</span>ApplicationDbContext<span class="token punctuation">></span></span><span class="token punctuation">(</span>options <span class="token operator">=</span><span class="token operator">></span>\n    options<span class="token punctuation">.</span><span class="token function">UseSqlServer</span><span class="token punctuation">(</span>Configuration<span class="token punctuation">[</span><span class="token string">"Data:DefaultConnection"</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">,</span>\n    ServiceLifetime<span class="token punctuation">.</span>Transient<span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n    services<span class="token punctuation">.</span><span class="token function">AddHangfire</span><span class="token punctuation">(</span>config <span class="token operator">=</span><span class="token operator">></span>\n    <span class="token punctuation">{</span>\n        config<span class="token punctuation">.</span><span class="token function">UseSqlServerStorage</span><span class="token punctuation">(</span>Configuration<span class="token punctuation">[</span><span class="token string">"Data:WorkQueue"</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n    <span class="token comment">// add our service to the ServiceProvider container</span>\n    services<span class="token punctuation">.</span><span class="token function">AddSingleton</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">TodoItemService</span><span class="token punctuation">(</span>Configuration<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n    <span class="token comment">// add the configuration object</span>\n    services<span class="token punctuation">.</span><span class="token function">AddSingleton</span><span class="token punctuation">(</span>Configuration<span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n    services<span class="token punctuation">.</span><span class="token function">AddMvc</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n<span class="token punctuation">}</span>\n\n<span class="token keyword">public</span> <span class="token keyword">void</span> <span class="token function">Configure</span><span class="token punctuation">(</span>IApplicationBuilder app<span class="token punctuation">,</span> ILoggerFactory loggerFactory<span class="token punctuation">,</span> IServiceProvider serviceProvider<span class="token punctuation">)</span>\n<span class="token punctuation">{</span>\n    loggerFactory<span class="token punctuation">.</span><span class="token function">AddConsole</span><span class="token punctuation">(</span>Configuration<span class="token punctuation">.</span><span class="token function">GetSection</span><span class="token punctuation">(</span><span class="token string">"Logging"</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n    loggerFactory<span class="token punctuation">.</span><span class="token function">AddDebug</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n    <span class="token comment">// add our activator to the GlobalConfiguration</span>\n    GlobalConfiguration<span class="token punctuation">.</span>Configuration<span class="token punctuation">.</span><span class="token function">UseActivator</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">ServiceProviderActivator</span><span class="token punctuation">(</span>serviceProvider<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n    app<span class="token punctuation">.</span><span class="token function">UseHangfireServer</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n    app<span class="token punctuation">.</span><span class="token function">UseMvc</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<h2>The Controller</h2>\n<p>The final piece is to create the endpoint. We want to kick off the job and return a <a href="https://tools.ietf.org/html/rfc2616#section-10.2.3">202 Accepted</a> response:</p>\n<blockquote>\n<p>10.2.3 202 Accepted :\nThe request has been accepted for processing, but the processing has not been completed.</p>\n</blockquote>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token comment">// Controllers/TodoItemsController.cs</span>\n<span class="token punctuation">[</span><span class="token function">Route</span><span class="token punctuation">(</span><span class="token string">"api/[controller]"</span><span class="token punctuation">)</span><span class="token punctuation">]</span>\n<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">TodoItemsController</span> <span class="token punctuation">:</span> Controller\n<span class="token punctuation">{</span>\n    <span class="token punctuation">[</span>HttpPost<span class="token punctuation">]</span>\n    <span class="token keyword">public</span> IActionResult <span class="token function">Post</span><span class="token punctuation">(</span><span class="token punctuation">[</span>FromBody<span class="token punctuation">]</span> TodoItem todoItem<span class="token punctuation">)</span>\n    <span class="token punctuation">{</span>\n        <span class="token comment">// start the job</span>\n        BackgroundJob<span class="token punctuation">.</span><span class="token generic-method function">Enqueue<span class="token punctuation">&lt;</span>TodoItemService<span class="token punctuation">></span></span><span class="token punctuation">(</span>service <span class="token operator">=</span><span class="token operator">></span> service<span class="token punctuation">.</span><span class="token function">CreateTodoItem</span><span class="token punctuation">(</span>todoItem<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n        <span class="token comment">// return Accepted status code</span>\n        <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">StatusCodeResult</span><span class="token punctuation">(</span><span class="token number">202</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token punctuation">}</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p>And that’s it. The full source code is on <a href="https://github.com/jaredcnance/hangfire-dot-net-core-example">Github</a> If you run the app and send a POST to <code class="language-text">http://localhost:5000/api/todoitems</code> you can see the job being created and executed.</p>',frontmatter:{title:"Long Running Tasks In .Net Core With Hangfire",date:"August 19, 2016"}}},pathContext:{slug:"/hangfire-tasks-in-dotnet-core/",previous:!1,next:{fields:{slug:"/typescript-vs-javascript/"},frontmatter:{title:"TypeScript vs JavaScript"}}}}}});
//# sourceMappingURL=path---hangfire-tasks-in-dotnet-core-1a9079460424abfdc46e.js.map