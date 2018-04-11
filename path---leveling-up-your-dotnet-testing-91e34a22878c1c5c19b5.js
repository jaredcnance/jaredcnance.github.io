webpackJsonp([0x94cf07cd042d],{518:function(n,s){n.exports={data:{site:{siteMetadata:{title:"nance.io",author:"Jared Nance"}},markdownRemark:{id:"/Users/jarednance/dev/gatsby-blog/src/pages/leveling-up-your-dotnet-testing/index.md absPath of file >>> MarkdownRemark",html:'<p>This is a two part blog post in which I will provide guidelines, opinions and tools that you can use to improve your .Net testing experience.\nIn part 1, I will first introduce a proposed solution structure, then I will talk about the importance and challenges of making your tests\nidempotent and finally I’ll show you how to use model factories to generate fake data for your tests.</p>\n<p>I am generally a fan of frameworks that reduce decision making by providing well thought out, sane default recommendations or opinions\nabout how things should be done. However, most .Net frameworks and libraries are predominantly un-opinionated which is good and bad.\nThe good part about it is that it provides you with extreme flexibility. The bad part is that it provides little to no guidance\naround a good path for doing things.</p>\n<p>I would like to point out that ASP.Net Core is much more opinionated than most .Net frameworks and does a really excellent job of\nproviding out-of-the-box tools like\n<a href="https://docs.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection">Dependency Injection</a>,\n<a href="https://docs.microsoft.com/en-us/aspnet/core/fundamentals/configuration/options">Configuration</a>,\n<a href="https://docs.microsoft.com/en-us/aspnet/core/fundamentals/environments">Environment loading</a> and\n<a href="https://docs.microsoft.com/en-us/aspnet/core/security/authentication/identity">Identity Management</a>.</p>\n<h2>Project Structure</h2>\n<p>The first is a proposal for project structure. Here is a sample directory tree that I use for all new projects.\nThe <code class="language-text">src</code> directory represents the actual application or class library projects that make up the Systems Under Test (SUT).\nThe <code class="language-text">test</code> directory contains all of the test projects that will validate the <code class="language-text">src</code> projects.</p>\n<div class="gatsby-highlight">\n      <pre class="language-text"><code class="language-text">Solution/\n├── src/\n│   └── Project1/\n│       ├── ...\n│       └── Project1.csproj\n└── tests/\n    └── Project1Tests/\n        ├── Acceptance/\n        ├── Factories/\n        ├── Fixtures/\n        ├── Integration/\n        ├── Stubs/\n        ├── Unit/\n        ├── Utilities/\n        ├── ...\n        └── Project1Tests.csproj</code></pre>\n      </div>\n<h3>Project : TestProject Ratio</h3>\n<p>I recommend a 1:1 relationship between <code class="language-text">src</code> projects and <code class="language-text">tests</code> projects.\nThis makes it very clear where tests should live for a specific piece of functionality.\nIt also mitigates the risk that a test project could be running different assembly versions than what the application actually runs.\nIf a test project references several different application projects, and those projects reference a common dependency at different\nversions it will have to generate\n<a href="https://docs.microsoft.com/en-us/dotnet/framework/configure-apps/redirect-assembly-versions">assembly redirects</a>\nto a compatible dependency version.</p>\n<h3>Test Project Structure</h3>\n<p>Within each test project, tests can be divided into 3 categories:</p>\n<ul>\n<li><strong>Unit</strong>: Tests that target individual method functionality in isolation</li>\n<li><strong>Integration</strong>: Tests that target multiple application layers</li>\n<li><strong>Acceptance</strong>: End-to-end tests, commonly using the ASP.Net Core <code class="language-text">TestServer</code> class</li>\n</ul>\n<p>Tests generally require additional functionality to construct the scenarios to be tested.\nThese fall into 4 common categories:</p>\n<ul>\n<li><strong>Factories</strong>: Classes to generate fake data</li>\n<li><strong>Fixtures</strong>: Classes that are used to share boilerplate or state between tests</li>\n<li><strong>Stubs</strong>: When mocks aren’t enough you may need to stub functionality. However, mocks should meet most requirements.</li>\n<li><strong>Utilities</strong>: Classes that provide common functionality for debugging, setup, or validation.</li>\n</ul>\n<h2>Tests Should be Idempotent</h2>\n<p>You should strive to make your tests idempotent, that is they should be able to run and pass anytime.\nThis means you should avoid using test framework decorators that prevent tests from running such as NUnit’s\n<code class="language-text">[Explicit]</code> and xUnit’s <code class="language-text">[Fact(Skip=&quot;...&quot;)]</code>.</p>\n<p>Often times developers will write tests to verify the functionality of a module at a particular time but fail to\nwrite the test in such a way that it can be run consistently in the future.\nI have observed four main causes of this:</p>\n<ol>\n<li><strong>The test depends on some external state that is difficult to construct</strong></li>\n</ol>\n<p>In some cases these challenges are very real. But I encourage you to apply the initial investment\nso that your tests can protect you against future changes. In my experience, once these test are excluded from the\ntest runs, they are rarely revisited. This means that all of the value gained from that test is realized during the\nmicro-development cycle in which it was written and afterwards provides no value to the project. With some extra\neffort you will continue to reap benefits from that test for as long as that functionality exists.</p>\n<ol start="2">\n<li><strong>The test has external side effects</strong></li>\n</ol>\n<p>Generally, with a little effort and some clean up code—in xUnit this is done via <code class="language-text">Dispose()</code>—this can be easily handled in most cases.\nIn part 2 of this blog post, I’ll demonstrate how to make your tests transactional so that you don’t even have to think\nabout this issue.</p>\n<ol start="3">\n<li><strong>The test is flaky</strong></li>\n</ol>\n<p>A flaky test is one that fails intermittently making the source of the error difficult to track down or reproduce.\nFlaky tests are usually a sign that something else is going on and it may actually be a bug in your application or library.\nOften times a test that fails intermittently is a sign that there is some boundary condition the test creates that is not\nproperly handled by the application. It could also mean that the test is not correctly testing the piece of functionality it\nwas intended to test and should be re-evaluated. Later on in this post I’ll demonstrate one way to deal with intermittently\nfailing tests caused by input data.</p>\n<ol start="4">\n<li><strong>The test is long running</strong></li>\n</ol>\n<p>Long running tests can be a pain because you don’t want to run them every time locally if you don’t expect the behavior to\nbe affected. However, there are alternatives to labelling them as explicit. You can also decorate your xUnit tests with\n<code class="language-text">Trait</code>s and then filter by those. For example, if you want to skip long running tests you can label them as\n<code class="language-text">[Trait(&quot;Exclude&quot;,&quot;Local&quot;)]</code>. Then you can run all tests that haven’t been excluded locally.</p>\n<div class="gatsby-highlight">\n      <pre class="language-text"><code class="language-text">dotnet test --filter Exclude!=Local</code></pre>\n      </div>\n<p>You can also filter your tests by the domain you’re working on. By default the test runner will filter by the FullyQualifiedName.\nSo, if you’re working on several layers of your stack that are all namespaced under <code class="language-text">Articles</code>, you can just:</p>\n<div class="gatsby-highlight">\n      <pre class="language-text"><code class="language-text">dotnet test --filter Articles</code></pre>\n      </div>\n<h2>Factories</h2>\n<p>Factories are an excellent way to reduce the boilerplate for individual tests.\nIf you’re not familiar with factories, they are a <a href="https://en.wikipedia.org/wiki/Creational_pattern">creational pattern</a>\nthat abstract the instantiation process of a type.\nThe simplest form a factory can take is:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">BeerFactory</span>\n<span class="token punctuation">{</span>\n    <span class="token keyword">public</span> Beer <span class="token function">Create</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">></span> <span class="token keyword">new</span> <span class="token class-name">Beer</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p>The most common use of Factories is to provide a mechanism for the instantiation of different implementations of an\ninterface that is dependent upon some runtime condition. Often times this takes the form of a switch statement:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">BeerFactory</span>\n<span class="token punctuation">{</span>\n    <span class="token keyword">public</span> IBeer <span class="token function">Create</span><span class="token punctuation">(</span>BeerType beerType<span class="token punctuation">)</span>\n    <span class="token punctuation">{</span>\n        <span class="token keyword">switch</span><span class="token punctuation">(</span>beerType<span class="token punctuation">)</span>\n        <span class="token punctuation">{</span>\n            <span class="token keyword">case</span> BeerType<span class="token punctuation">.</span>Ale<span class="token punctuation">:</span>\n                <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">Ale</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n            <span class="token keyword">case</span> BeerType<span class="token punctuation">.</span>Stout<span class="token punctuation">:</span>\n                <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">Stout</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n            <span class="token keyword">case</span> BeerType<span class="token punctuation">.</span>Lager<span class="token punctuation">:</span>\n                <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">Lager</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n            <span class="token comment">// ...</span>\n        <span class="token punctuation">}</span>\n    <span class="token punctuation">}</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p>However, we’re going to discuss an entirely different use case for Factories: test model instantiation.\nWe will use factories in our tests to:</p>\n<ul>\n<li>Isolate model creation</li>\n<li>Generate fake data and add entropy to our tests</li>\n</ul>\n<p>The idea of using factories for test data is by no means a new concept and is ubiquitous in other communities.\nHowever, I rarely see their use in .Net projects so, I wanted to write this post to try and make the concept\nmore relatable and concrete for .Net developers who may not be familiar with this practice.</p>\n<p>To start let’s consider the following test case that is intended to compute the cost of an item.</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">public</span> <span class="token keyword">async</span> Task <span class="token function">GetPrice_Returns_The_Expected_Item_Price</span><span class="token punctuation">(</span><span class="token punctuation">)</span>\n<span class="token punctuation">{</span>\n    <span class="token comment">// arrange</span>\n    <span class="token keyword">var</span> item <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ShoppingCartItem</span> <span class="token punctuation">{</span>\n        Name <span class="token operator">=</span> <span class="token string">"Beer"</span><span class="token punctuation">,</span>\n        UnitCost <span class="token operator">=</span> <span class="token number">5.00</span>m<span class="token punctuation">,</span>\n        Count <span class="token operator">=</span> <span class="token number">5</span><span class="token punctuation">,</span>\n        CostType <span class="token operator">=</span> CostType<span class="token punctuation">.</span>Count\n    <span class="token punctuation">}</span><span class="token punctuation">;</span>\n\n    <span class="token keyword">var</span> expectedCost <span class="token operator">=</span> item<span class="token punctuation">.</span>UnitCost <span class="token operator">*</span> item<span class="token punctuation">.</span>Count<span class="token punctuation">;</span>\n\n    <span class="token keyword">var</span> itemCostCalculator <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ItemCostCalculator</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n    <span class="token comment">// act</span>\n    <span class="token keyword">var</span> actualCost <span class="token operator">=</span> itemCostCalculator<span class="token punctuation">.</span><span class="token function">GetTotalPrice</span><span class="token punctuation">(</span>item<span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n    <span class="token comment">// assert</span>\n    Assert<span class="token punctuation">.</span><span class="token function">Equal</span><span class="token punctuation">(</span>expectedCost<span class="token punctuation">,</span> actualCost<span class="token punctuation">)</span><span class="token punctuation">;</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p>This test seems fine, but it’s very static. Every time it runs it will do the same thing without variation\nand doesn’t flex the system very much. Alternatively, we could generate random values and manually construct\nour instance:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">var</span> item <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ShoppingCartItem</span> <span class="token punctuation">{</span>\n    Name <span class="token operator">=</span> Guid<span class="token punctuation">.</span><span class="token function">NewGuid</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">ToString</span><span class="token punctuation">(</span><span class="token string">"N"</span><span class="token punctuation">)</span><span class="token punctuation">,</span>\n    UnitCost <span class="token operator">=</span> <span class="token function">GetRandomDecimal</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span>\n    Count <span class="token operator">=</span> <span class="token function">GetRandomInteger</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span>\n    CostType <span class="token operator">=</span> <span class="token generic-method function">GetRandomEnum<span class="token punctuation">&lt;</span>CostType<span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span>\n<span class="token punctuation">}</span><span class="token punctuation">;</span>\n</code></pre>\n      </div>\n<p>This is better because we alter the inputs to our system under test (SUT) on every test run.\nHowever, the problem with this is that you will have to write code that performs the generation\nof these random values and it will not be reproducible in the event of a failure\n(i.e. using <code class="language-text">Guid</code> for strings is not going to be reproducible).</p>\n<p>Luckily, others have already done this kind of work for us. Some great projects for .Net are:</p>\n<ul>\n<li><a href="https://github.com/bchavez/Bogus">Bogus</a></li>\n<li><a href="https://github.com/FakeItEasy/FakeItEasy">FakeItEasy</a></li>\n<li><a href="https://github.com/jonwingfield/Faker.Net">Faker.Net</a></li>\n<li><a href="https://github.com/nbuilder/nbuilder">NBuilder</a></li>\n</ul>\n<p>I’ll be using Bogus, but you can do the same kinds of things with any of the above packages.</p>\n<p>So, to begin let’s see an example of how we can create a factory for our <code class="language-text">ShoppingCartItem</code>:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">using</span> Bogus<span class="token punctuation">;</span>\n\n<span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">class</span> <span class="token class-name">ShoppingCartItemFactory</span>\n<span class="token punctuation">{</span>\n    <span class="token keyword">public</span> List<span class="token operator">&lt;</span>ShoppingCartItem<span class="token operator">></span> <span class="token function">Get</span><span class="token punctuation">(</span><span class="token keyword">int</span> count <span class="token operator">=</span> <span class="token number">1</span><span class="token punctuation">)</span>\n        <span class="token operator">=</span><span class="token operator">></span> <span class="token keyword">new</span> <span class="token class-name">Faker</span><span class="token operator">&lt;</span>ShoppingCartItem<span class="token operator">></span><span class="token punctuation">(</span><span class="token punctuation">)</span>\n            <span class="token punctuation">.</span><span class="token function">RuleFor</span><span class="token punctuation">(</span>i <span class="token operator">=</span><span class="token operator">></span> i<span class="token punctuation">.</span>Name<span class="token punctuation">,</span> f<span class="token punctuation">.</span>Commerce<span class="token punctuation">.</span><span class="token function">Product</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span>\n            <span class="token punctuation">.</span><span class="token function">RuleFor</span><span class="token punctuation">(</span>i <span class="token operator">=</span><span class="token operator">></span> i<span class="token punctuation">.</span>UnitCost<span class="token punctuation">,</span> f <span class="token operator">=</span><span class="token operator">></span> f<span class="token punctuation">.</span>Random<span class="token punctuation">.</span><span class="token function">Decimal</span><span class="token punctuation">(</span>min<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">)</span>\n            <span class="token punctuation">.</span><span class="token function">RuleFor</span><span class="token punctuation">(</span>i <span class="token operator">=</span><span class="token operator">></span> i<span class="token punctuation">.</span>Count<span class="token punctuation">,</span> f <span class="token operator">=</span><span class="token operator">></span> f<span class="token punctuation">.</span>Random<span class="token punctuation">.</span><span class="token function">Number</span><span class="token punctuation">(</span>min<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">)</span>\n            <span class="token punctuation">.</span><span class="token function">RuleFor</span><span class="token punctuation">(</span>i <span class="token operator">=</span><span class="token operator">></span> i<span class="token punctuation">.</span>Weight<span class="token punctuation">,</span> f <span class="token operator">=</span><span class="token operator">></span> f<span class="token punctuation">.</span>Random<span class="token punctuation">.</span><span class="token function">Decimal</span><span class="token punctuation">(</span>min<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">)</span>\n            <span class="token punctuation">.</span><span class="token function">RuleFor</span><span class="token punctuation">(</span>i <span class="token operator">=</span><span class="token operator">></span> i<span class="token punctuation">.</span>CostType<span class="token punctuation">,</span> f <span class="token operator">=</span><span class="token operator">></span> f<span class="token punctuation">.</span>Random<span class="token punctuation">.</span><span class="token generic-method function">PickRandom<span class="token punctuation">&lt;</span>ItemType<span class="token punctuation">></span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span>\n            <span class="token punctuation">.</span><span class="token function">Generate</span><span class="token punctuation">(</span>count<span class="token punctuation">)</span><span class="token punctuation">;</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p>Then in our tests we can use our factory:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">public</span> <span class="token keyword">async</span> Task <span class="token function">GetPrice_Returns_The_Expected_Item_Price</span><span class="token punctuation">(</span><span class="token punctuation">)</span>\n<span class="token punctuation">{</span>\n    <span class="token comment">// arrange</span>\n    <span class="token keyword">var</span> item <span class="token operator">=</span> ShoppingCartItemFactory<span class="token punctuation">.</span><span class="token function">Get</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">First</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n    <span class="token keyword">var</span> units <span class="token operator">=</span> <span class="token punctuation">(</span>item<span class="token punctuation">.</span>ItemType <span class="token operator">==</span> ItemType<span class="token punctuation">.</span>Weighed<span class="token punctuation">)</span>\n        <span class="token operator">?</span> item<span class="token punctuation">.</span>Weight\n        <span class="token punctuation">:</span> item<span class="token punctuation">.</span>Count<span class="token punctuation">;</span>\n\n    <span class="token keyword">var</span> expectedCost <span class="token operator">=</span> units <span class="token operator">*</span> item<span class="token punctuation">.</span>UnitCost<span class="token punctuation">;</span>\n\n    <span class="token keyword">var</span> itemCostCalculator <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">ItemCostCalculator</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n    <span class="token comment">// act</span>\n    <span class="token keyword">var</span> actualCost <span class="token operator">=</span> itemCostCalculator<span class="token punctuation">.</span><span class="token function">GetTotalPrice</span><span class="token punctuation">(</span>item<span class="token punctuation">)</span><span class="token punctuation">;</span>\n\n    <span class="token comment">// assert</span>\n    Assert<span class="token punctuation">.</span><span class="token function">Equal</span><span class="token punctuation">(</span>expectedCost<span class="token punctuation">,</span> actualCost<span class="token punctuation">)</span><span class="token punctuation">;</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p>So, we’re now generating fake data that may even resemble some of the actual inputs our system will receive.\nAnd our test is a little more pleasant to read.\nBut, what kind of scenarios exist that fake data can actually help us catch?\nConsider the following requirement:</p>\n<blockquote>\n<p>The total cost is the unit cost multiplied by the count if the unit is priced by count.\nHowever if the unit is priced by weight, then the total cost is the unit cost multiplied by the\nweight of the unit.</p>\n</blockquote>\n<p>Okay so now consider a faulty <code class="language-text">ItemCostCalculator</code> implementation that does not take item type\ninto consideration and assumes all items are priced by count:</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">ItemCostCalculator</span>\n<span class="token punctuation">{</span>\n    <span class="token keyword">public</span> <span class="token keyword">decimal</span> <span class="token function">GetTotalPrice</span><span class="token punctuation">(</span>ShoppingCartItem item<span class="token punctuation">)</span>\n        <span class="token operator">=</span><span class="token operator">></span> item<span class="token punctuation">.</span>Count <span class="token operator">*</span> item<span class="token punctuation">.</span>UnitCost<span class="token punctuation">;</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p>Our original test would have passed every time because we only ever tested the count condition.\nHowever, we will get intermittent failures of our new test, because we expect the calculator to correctly\ncompute cost based on <code class="language-text">ItemType</code>. We can now fix our <code class="language-text">ItemCostCalculator</code> and the test will pass every time.</p>\n<p>I would like to quickly point out that in this example you <strong>should</strong> write\nmultiple tests that test both conditions separately. However, the regular\nuse of fake data generation in tests helps us to catch mistakes like this one.</p>\n<h3>Reproducing Flaky Tests</h3>\n<p>One challenge with using generated data is that it can be difficult to reproduce failures locally.\nSo, the tests may fail during CI, but if you can’t reproduce them consistently then it can be difficult to\ntrack down root cause. I was recently working with <a href="https://github.com/rtablada">Ryan Tablada</a> on this\nexact issue and the solution he proposed was to use the same seed for all data generation tests and log that seed\nat the beginning of the test. This seed can be overridden by an environment variable, allowing us to re-run the\ntests with the same fake data.</p>\n<p>Each test can inherit from a base test fixture that sets the seed in its\n<a href="https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/static-constructors">static constructor</a>.\nThe CLR ensures that static constructors are only called once per process making this operation thread safe.\nSince it is only called once, all tests will use the same seed and you will only log the seed once at the beginning\nof the run.</p>\n<p>Prior to .Net Core static constructors would be invoked per AppDomain rather than per process.\nHowever, the AppDomain no longer exists so this is a non-issue for .Net Core users.\nIf you’re using an older testing framework (e.g. <a href="http://nunit.org/docs/2.6.3/assemblyIsolation.html">NUnit</a>)\nthat provides AppDomain isolation between individual tests, this exact solution will probably not work for you.\nHowever, most testing frameworks provide a way to share state across all tests, so using their built-in APIs should work.</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">ItemCostCalculator_Tests</span> <span class="token punctuation">:</span> TestFixture <span class="token punctuation">{</span> <span class="token comment">/*...*/</span> <span class="token punctuation">}</span>\n\n<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">TestFixture</span>\n<span class="token punctuation">{</span>\n    <span class="token keyword">private</span> <span class="token keyword">static</span> <span class="token keyword">int</span> Seed<span class="token punctuation">;</span>\n    <span class="token keyword">static</span> <span class="token function">TestFixture</span><span class="token punctuation">(</span><span class="token punctuation">)</span>\n    <span class="token punctuation">{</span>\n        <span class="token keyword">var</span> randTick <span class="token operator">=</span> DateTime<span class="token punctuation">.</span>Now<span class="token punctuation">.</span>Ticks <span class="token operator">&amp;</span> <span class="token number">0x0000FFFF</span><span class="token punctuation">;</span>\n        Seed <span class="token operator">=</span> <span class="token keyword">int</span><span class="token punctuation">.</span><span class="token function">TryParse</span><span class="token punctuation">(</span>Environment<span class="token punctuation">.</span><span class="token function">GetEnvironmentVariable</span><span class="token punctuation">(</span><span class="token string">"TEST_SEED"</span><span class="token punctuation">)</span><span class="token punctuation">,</span> <span class="token keyword">out</span> <span class="token keyword">var</span> seedOverride<span class="token punctuation">)</span>\n                <span class="token operator">?</span> seedOverride\n                <span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token keyword">int</span><span class="token punctuation">)</span>randTick<span class="token punctuation">;</span>\n\n        Console<span class="token punctuation">.</span><span class="token function">WriteLine</span><span class="token punctuation">(</span>$<span class="token string">"Using test seed: {_seed}"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token punctuation">}</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p>Now in the instance constructor, we assign the seed back to the Bogus randomizer.\nThis will ensure that each individual test runs with the correct seed.</p>\n<div class="gatsby-highlight">\n      <pre class="language-csharp"><code class="language-csharp"><span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">TestFixture</span>\n<span class="token punctuation">{</span>\n    <span class="token keyword">private</span> <span class="token keyword">static</span> <span class="token keyword">int</span> Seed<span class="token punctuation">;</span>\n    <span class="token keyword">static</span> <span class="token function">TestFixture</span><span class="token punctuation">(</span><span class="token punctuation">)</span>\n    <span class="token punctuation">{</span>\n        <span class="token keyword">var</span> randTick <span class="token operator">=</span> DateTime<span class="token punctuation">.</span>Now<span class="token punctuation">.</span>Ticks <span class="token operator">&amp;</span> <span class="token number">0x0000FFFF</span><span class="token punctuation">;</span>\n        Seed <span class="token operator">=</span> <span class="token keyword">int</span><span class="token punctuation">.</span><span class="token function">TryParse</span><span class="token punctuation">(</span>Environment<span class="token punctuation">.</span><span class="token function">GetEnvironmentVariable</span><span class="token punctuation">(</span><span class="token string">"TEST_SEED"</span><span class="token punctuation">)</span><span class="token punctuation">,</span> <span class="token keyword">out</span> <span class="token keyword">var</span> seedOverride<span class="token punctuation">)</span>\n                <span class="token operator">?</span> seedOverride\n                <span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token keyword">int</span><span class="token punctuation">)</span>randTick<span class="token punctuation">;</span>\n\n        Console<span class="token punctuation">.</span><span class="token function">WriteLine</span><span class="token punctuation">(</span>$<span class="token string">"Using test seed: {Seed}"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token punctuation">}</span>\n\n    <span class="token keyword">public</span> <span class="token function">TestFixture</span><span class="token punctuation">(</span><span class="token punctuation">)</span>\n    <span class="token punctuation">{</span>\n        Randomizer<span class="token punctuation">.</span>Seed <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Random</span><span class="token punctuation">(</span>Seed<span class="token punctuation">)</span><span class="token punctuation">;</span>\n    <span class="token punctuation">}</span>\n<span class="token punctuation">}</span>\n</code></pre>\n      </div>\n<p>By assigning the seed to the Bogus <code class="language-text">Randomizer</code> in the instance constructor we can ensure that\neach individual test within a test run will use the same seed.\nSo, when we get the intermittent failure described above, we should be able to go to our test log\nand see something like:</p>\n<div class="gatsby-highlight">\n      <pre class="language-text"><code class="language-text">Using test seed: 73202934</code></pre>\n      </div>\n<p>We can then pull the branch locally and set the environment variable:</p>\n<p>CMD:</p>\n<div class="gatsby-highlight">\n      <pre class="language-text"><code class="language-text">setx TEST_SEED 73202934</code></pre>\n      </div>\n<p>Bash:</p>\n<div class="gatsby-highlight">\n      <pre class="language-text"><code class="language-text">export TEST_SEED=73202934</code></pre>\n      </div>\n<p>Now, when we re-run the test, the model factories will use the same seeds and generate\nthe same fake data causing the test to fail again.</p>\n<h2>Summary</h2>\n<p>Using test model factories to generate fake data for our unit tests is a good way to increase the coverage\nof our tests across multiple runs while also providing the added benefit of making our tests more legible.\nBy adding randomness to our tests we can discover issues that may never be discovered through the use of\nstatic test data.</p>\n<h2>What’s Next</h2>\n<p>In my next post on .Net testing, I will show some ways we can make tests with side-effects idempotent via\ntest cleanup methods and transactional integration testing.</p>',
frontmatter:{title:"Leveling Up Your .Net Testing Patterns - Part I",date:"April 08, 2018"}}},pathContext:{slug:"/leveling-up-your-dotnet-testing/",previous:{fields:{slug:"/dotnet-performance-optimization/"},frontmatter:{title:"A Strategy for the Measurement and Optimization of .NET Application Performance"}},next:!1}}}});
//# sourceMappingURL=path---leveling-up-your-dotnet-testing-91e34a22878c1c5c19b5.js.map