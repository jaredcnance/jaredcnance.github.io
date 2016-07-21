---
layout: post
title: "Continuous Integration In VSO with .Net Core And EmberJS"
date: 2016-07-21 07:00:00 -0500
categories: dotnet deployment emberjs
comments: true
---

## Introduction

This is a continuation of my last post [Continuous Integration In VSO with .Net Core And Azure WebJobs](continuous-integration-in-vso-with-dotnet-core-and-azure-web-jobs.html) 
in which I show how to setup a CI build in VSO for a .Net core website. 
The extension here is showing how to deploy your client app (specifically EmberJS) along with your web app.    

## The Build

We will be injecting our ember build into the same build definition discussed in my last post.
The entire process can be added immediately after the **[Visual Studio Build](https://www.visualstudio.com/docs/build/steps/build/visual-studio-build)** step.  

- **[npm](https://marketplace.visualstudio.com/items?itemName=fknop.vscode-npm)**: install Ember-CLI
  - Command: `install`
  - Arguments: `-g ember-cli`
- **[npm](https://marketplace.visualstudio.com/items?itemName=fknop.vscode-npm)**: install node packages
  - Command: `install`
  - Working Directory: `src/{EMBER_APP_DIRECTORY}`
- **[bower](https://marketplace.visualstudio.com/items?itemName=donjayamanne.bower)**: install bower packages
  - Bower Command: `install`
  - Bower JSON Path: `src/{EMBER_APP_DIRECTORY}/bower.json`
- **[Command Line](https://www.visualstudio.com/docs/build/steps/utility/command-line)**: run tests
  - Tool: `ember`
  - Arguments: `test`
  - Working Folder: `src/{EMBER_APP_DIRECTORY}`
- **[Command Line](https://www.visualstudio.com/docs/build/steps/utility/command-line)**: build ember app
  - Tool: `ember`
  - Arguments: `build --environment=production`
  - Working Folder: `src/{EMBER_APP_DIRECTORY}`
- **[Copy Files](https://www.visualstudio.com/docs/build/steps/utility/copy-files)**: copy the dist directory into the web app wwwroot
  - Source Folder: `src/{EMBER_APP_DIRECTORY}/dist`
  - Contents: `**`
  - Target Folder: `$(Build.SourcesDirectory)/src/{WEB_APP_DIRECTORY}/wwwroot`

In the end, you should have something that looks something like this:

![Final Build Definition]({{ site.url }}/assets/72116_finalBuildDefinition.png)

