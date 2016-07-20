---
layout: post
title: "Continuous Integration In VSO with .Net Core And Azure WebJobs"
date: 2016-07-20 12:00:00 -0500
categories: dotnet deployment
comments: true
---

## Introduction

I have yet to find a good article detailing how to deploy a dotnet core app with one or more WebJobs to Azure. 
While this may be a simple task, I struggled a bit when I first started playing with VSO automated builds so I think there are people out there who can benefit.

## Why Continuous Integration

Continuous integration allows us to automate our deployment with the single push of a button or by simply pushing our code.
The way I prefer to do this, is through a Pull Request and formal code review with all devs involved.
Someone submits a PR, the team reviews the request and once everything is looking good, we merge into our master branch.
If we have set our build process up, we can trigger the build when code is pushed to master.
This can make our deployment much smoother.  

## WebJobs

In case you aren't familiar, WebJobs provide a mechanism for running console applications in Azure.
They can be scheduled or continuously running and you simply deploy them with your web app. 
Currently, I am using this as a way to deploy peices of a micro-service architecture.
Web apps are deployed as App Services and console apps which subscribe to a message bus are deployed underneath them as WebJobs.

The thing to know about Web Job deployment:

They will always be published (by convention) under the App_Data folder of your web app:

```
../{my-app}/wwwroot/App_Data/jobs/continuous/{my-web-job}
../{my-app}/wwwroot/App_Data/jobs/triggered/{my-web-job}
```

## Build

So, the first step is to create a new build definition by clicking the green plus sign in the left menu:

![Add Build Definition]({{ site.url }}/assets/72016_addBuildDefinition.png)

Now we need to add the steps to build the project and get it ready for deployment.

- The first step is to run `dotnet restore` from the command line. Dotnet should already be installed and on the PATH.
  - Tool: `dotnet`
  - Arguments: `restore`
- Next we will go ahead and build the solution by running a "Visual Studio Build" 
  - Solution: `**\*.sln`
  - Platform: `$(BuildPlatform)`
  - Configuration: `$(BuildConfiguration)`
- Run Tests by adding another "Command Line" step:
  - Tool: `dotnet`
  - Arguments: `test`
  - Working Folder: `test/{MY_TEST_DIRECTORY}`
- Publish your WebJob by adding a "Command Line" step. You will need to do this FOR EACH web job in your solution.
  - Tool: `dotnet`
  - Arguments: `publish -c $(BuildConfiguration) -o ../{WEB_APP_DIRECTORY}/wwwroot/App_Data/jobs/continuous/{WEB_JOB_NAME}`
  - Working Folder: `src/{WEB_JOB_DIRECTORY}`
- Publish the web application by adding a "Command Line":
  - Tool: `dotnet`
  - Arguments: `publish -c $(BuildConfiguration)`
  - Working Folder: `src/{WEB_APP_DIRECTORY}`
- We need to zip the published files by adding an "Archive Files" step. You will need to do this FOR EACH web app in your solution.
  - Root folder (or file) to archive: `src/{WEB_APP_DIRECTORY}/bin/$(BuildConfiguration)/net451/win7-x64/publish`
  - Archive type: zip
  - Archive file to create: `$(Build.ArtifactStagingDirectory)/$(Build.BuildId).zip`
- Add a "Copy Files" step
  - Contents: `**/*.zip`
  - Target Folder: `$(Build.ArtifactStagingDirectory)`
- Publish Artifact
  - Path to Publish: `$(Build.ArtifactStagingDirectory)`
  - Artifact Name: `drop`
  - Artifact Type: Server

In the end, you should have something that looks something like this:

![Final Build Definition]({{ site.url }}/assets/72016_finalBuildDefinition.png)

## Release

The next step is to set up a release pipeline that gets activated everytime a Build completes.
I feel that this is pretty straightforward so I won't go into too much detail unless I see demand for it. 
Each web app that we published above will be available to deploy as a Web Deploy package. 
All you have to do is add a "Deploy Website To Azure" task for each website and point to the appropriate zip file created during the build.

## Issues

I ran into one issue which has yet to be solved involving running `dotnet test`. 
I can get it to run successfully on a simple test project. 
But, if I run it on a project that has a lot of integration tests and is standing up databases and web servers, it hangs and exceeds the 30 minute allowed build time.
I'm not sure what the root cause is yet since even these more complex test projects run in a couple minutes on my dev machine.

## Next

In the near future I will be adding onto this by showing how to deploy an Ember app with your App Service. 