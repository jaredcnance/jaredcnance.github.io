---
layout: post
title:  ".Net Core - RC2 to v1.0"
date:   2016-06-27 19:30:29 -0500
categories: dotnet core
comments: true
---
# It's finally here!

For those who are unaware, .Net Core 1.0.0 was [officially released today](https://github.com/dotnet/core/releases/tag/1.0.0). 
Below, I have documented my upgrade process from RC2 to RTM and any issues I encountered. 
If you were using RC1 and upgraded to RC2, the process is pretty similar, 
but there are far fewer breaking API changes.

**Note**: If you haven't already upgraded to RC2, a lot of things have changed which 
I won't be covering here. It has been pretty well documented: 
[here](https://docs.asp.net/en/latest/migration/rc1-to-rc2.html), 
[here](https://github.com/aspnet/Home/issues/1381), 
[here](https://wildermuth.com/2016/05/17/Converting-an-ASP-NET-Core-RC1-Project-to-RC2), and 
elsewhere.

## RC2 to v1.0.0 (RTM)

### Installation

- Uninstall RC2 - approx 5 min
    - Microsoft .NET Core 1.0.0 RC2 - Runtime
    - Microsoft .NET Core 1.0.0 RC2 - SDK Preview 1
    - Microsoft .NET Core 1.0.0 RC2 - VS 2015 Tooling Preview 1
    - Microsoft .NET Core 1.0.0 RC2 - Windows Server Hosting
    - Microsoft .NET Version Manager (Note this was an artifact from rc1)
- Install [Visual Studio 2015 Update 3](https://www.visualstudio.com/news/releasenotes/vs2015-update3-vs) - approx 23 min
- Install [Microsoft .NET Core 1.0.0 VS 2015 Tooling Preview 2](https://go.microsoft.com/fwlink/?LinkId=817245) - approx 3 min
- (Optional if using VS) Install [Microsoft .NET Core 1.0.0 - SDK Preview 2](https://go.microsoft.com/fwlink/?LinkID=809122) - approx 3 min
- Confirm install by running `$ dotnet --version` should return 1.0.0-preview2-003121
- Bump the version in `global.json` to 1.0.0-preview2-003121

### Packages

- Bump all 1.0.0-rc2- dependencies to 1.0.0 in all `project.json` files. For me this was quite simple, a "Replace All" of "-rc2-final" with "" in project.json fixed all but a few instances.
- Bump any 1.0.0-preview1-final dependencies to 1.0.0-preview2-final
- Run `$ dotnet restore`


### Code changes

If you were manually enforcing camelCase JSON responses in your web apps, this is now the default behavior.


{% highlight csharp %}
// Startup.cs
public void ConfigureServices(IServiceCollection services)
{
  ...
  services.AddMvc()
     // no longer required
     // .AddJsonOptions(options =>
     // {
     //   options.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
     // })
  ...
}
{% endhighlight %}

## Issues

- When opening an RC2 project in VS, if you receive the following prompt, 
you need to upgrade the version referenced by `global.json` to 1.0.0-preview2-003121

> The project is configured to use .NET Core SDK version 1.0.0-preview-2-00... which is not installed or cannot be found under the path ...

- For me, when I ran dotnet restore, I received several package downgrade warnings. So, to be on the safe side, I cleared my NuGet cache by deleting all the folders in `%USERPROFILE%/.nuget/packages/` prior to running dotnet restore again.
- I also encounterred some dependency mismatches that had not been caught by the prior version of the tooling. Specifically, I had several projects referencing different versions of Newtonsoft.Json which gave me the following errors. I was able to correct my `project.json` files and move on.

> ...\warning CS8012: Referenced assembly 'MyAssembly, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null' targets a different processor. MyAssembly2	C:\Program Files (x86)\MSBuild\Microsoft\VisualStudio\v14.0\DotNet\Microsoft.DotNet.Common.Targets

> ...\error CS1705: Assembly 'Microsoft.AspNetCore.Mvc.Formatters.Json' with identity 'Microsoft.AspNetCore.Mvc.Formatters.Json, Version=1.0.0.0, Culture=neutral, PublicKeyToken=adb9793829ddae60' uses 'Newtonsoft.Json, Version=9.0.0.0, Culture=neutral, PublicKeyToken=30ad4fe6b2a6aeed' which has a 
higher version than referenced assembly 'Newtonsoft.Json' with identity 'Newtonsoft.Json, Version=8.0.0.0, Culture=neutral, PublicKeyToken=30ad4fe6b2a6aeed'

- If you use any of the OpenIdConnect stuff (including [OpenIddict](https://github.com/openiddict/openiddict-core)), you will likely get the following error. There were a few class renames announced [here](https://github.com/aspnet/Announcements/issues/187). The discussion for this issue can be found [here](https://github.com/aspnet/DependencyInjection/issues/411). For me, I am using OpenIddictCore, so I will be waiting for the resolution [here](https://github.com/openiddict/openiddict-core/pull/147).

> System.TypeLoadException: Could not load type 'Microsoft.Extensions.DependencyInjection.ServiceProviderExtensions' from assembly 'Microsoft.Extensions.DependencyInjection.Abstractions, Version=1.0.0.0, Culture=neutral, PublicKeyToken=adb9793829ddae60'. at Microsoft.AspNetCore.Builder.OpenIdConnectServerExtensions.UseOpenIdConnectServer(IApplicationBuilder app, Action1 configuration) at MyAssembly.Startup.Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory, RoleManager1 roleManager) in C:\Startup.cs

## Conclusion

I'd like to thank all those who beat me to the punch and documented their experiences as well:


- [Official Documentation][documentation]
- [Rick Strahl][rick-strahl]
- [Shawn Wildermuth][shawn-wildermuth]

[documentation]: https://docs.asp.net/en/latest/migration/rc2-to-rtm.html
[rick-strahl]: https://weblog.west-wind.com/posts/2016/Jun/27/Upgrading-to-ASPNET-Core-RTM-from-RC2
[shawn-wildermuth]: https://wildermuth.com/2016/06/27/Converting-ASP-NET-Core-1-0-RC2-to-RTM-Bits
