---
layout: post
title:  "Refactoring Legacy Projects"
date:   2017-01-04 00:00:00 -0500
categories: devops
comments: true
image: 010516_refactoring.png
description: 
---

## Introduction

I recently had the opportunity to do a major refactor on an application which was quite unpleasant to read.
Let me clarify by saying the application concept and design was quite interesting and well done, but the code and implementation 
was not very well thought out and appeared to have been thrown together without much care to the architecture or structure.
There were several reasons the application ended up this way including:

- multiple people spending partial time on it without oversight or review
- lack of resources
- changing requirements
- lack of experience by some of the developers

These reasons may sound familiar to many of you, but let me start by saying that even with these issues,
there is really no excuse (other than perhaps lack of experience) for bad code. From my experience, taking
your time and taking pride in your work will result in better code that requires less time doing bug fixes,
maintenance, and tends to be less brittle to change and is well worth the upfront investment.

Before diving in, just for added context, I'll briefly go over the application and what was required. The application
was a C# .Net Web Forms application used to help Health Care Providers perscribe correct drug dosages based on the patient's 
specific [pharamcokinetic](https://en.wikipedia.org/wiki/Pharmacokinetics) or metabolic response to the administered drug. 
The application was not in production
due to some lingering bugs that hadn't been resolved for over a year. The original developers no longer worked on the project
and were not reachable for collaboration. The goal was simple: refactor the code and make it work.
After spending most of three weeks in the code, I was able to untangle the spaghetti mess and fix all the mystery bugs 
and issues that inititated the refactor. This blog will detail some suggestions and lessons I learned during the process.

## General Suggestions

My first and primary suggestion is that regardless of whether you are doing a refactor or just your day-to-day
coding, never complain about bad code written by someone else. If the code smells, fix it. 
Like [Uncle Bob](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882) said, per the "Boy Scout Rule":

> leave the code cleaner than we found it

The following are some simple suggestions to follow while you do your refactor and are also good ideas to follow in general:

#### Fix poor naming

In this particular project, naming was one of the biggest issues and increased the overhead required to understand the code significantly.
Names were inacurrate, multiple names were used for the same concept, and sometimes a single name would be used for multiple ideas. 
What all this boils down to is bad modeling of the domain problem. During your work my advice for naming is this:

- fix inacurrate names early
- identify the true domain models, this may require a non trivial amount of work
- fix every local variable name in every line of code that you can so that it better represents the concept
- above all, be consistent

#### Build, test, and commit often

One mistake, in my opinion is to make a large bumber of cross-cutting changes without committing your code.
It can become very difficult to explain all of the changes that you had to make if they have all been buried
in a single commit. Along with this comes validating your commits. If possible, I try to ensure that I can build
the project before I make each commit so that if I ever need to revert back to a prior state I don't have to worry about
"just getting it to work". This of course is not always possible. If you are about to make a change that will affect a
significant amount of the code, consider creating a new branch for that change first.

#### Keep and maintain a running list of issues

In order to maintain a logical change progression during the refactoring process, it is important to stay on task.
Pick an issue and fix it. Making changes off task or out of context can introduce new and difficult to diagnose bugs.
When I was going through the code, I did my best to **stay on task** so that all of the changes would be part of the same context.
However, when you're doing this, you will often encounter issues that are out of context for the current change. 
That's okay, write it down and make sure you return to it. The refactor should not be considered complete until all of
your TODO's have been cleaned up. 

## 1. Grab the Low Hanging Fruit

I decided to split my refactor into three major phases each with a few minor groups. 
The first phase was to grab low hanging fruit. During this phase I performed small changes that allowed me to get familiar with the
code base while still improving it. Here are some simple suggestions to get you started:

- split big methods into smaller methods - each method has a single responsibility
- simple naming 
    - ensure variable and class name modifiers are meaningful (i.e. `modelInstance` vs. `model`)
    - ensure local scope consistency
- remove unused code (easier said than done when it comes to dynamic languages with no tests)
- single class per file
- create visualizations of the current state and the desired state

## 2. Major Contexts

After I made my "simple" fixes, I had a good enough understanding of the code and its intent to start attacking
some of the major areas. I identified each of these and for this particular application there were four of these:

- Logic-View Separation
    - **problem**: most logic was performed by the view
    - **solution**: implemented an MVP architecture
- Domain Modeling
    - **problem**: the domain had not been clearly defined, there were a few classes (> 2000 lines long) that performed most of the work
    - **solution**: identified the core ideas and separated them
- Data Access
    - **problem**: the data access ocurred directly inline via SQL queries. There was also a known need for the concrete data access method to change in the near future
    - **solution**: implemented the repository pattern
- Class coupling
    - **problem**: classes were very tightly coupled making the solution brittle to change
    - **solution**: implemented a dependency injection framework and the composition root pattern to rely on interfaces rather than concrete implementations

For every application, there will likely be different contexts with different problems and solutions. 
I have just included some of these as an example. While working on each context, my secondary goal was to get the code 
relating to that issue into a readable state. You should be able to traverse the paths of execution (without running/debugging the program) 
without getting lost or confused. Consider cloning a duplicate copy of the repository that will remain separate from your working copy. 
This allows you to debug code in a previous state, while also reviewing the code in the working state

## 3. The Deep Dive

Now the code was in a decently readable state. However, there was still a significant amount of redundant code and sometimes even completely
unused code. This led me into the final phase of the reactor: The Deep Dive. By now, I had a decent understanding of the code and it would
be much easier to make changes without breaking everything and getting completely lost. So, what did I do? I started over, from the application's 
entry point forward. My goal was to ensure every line of code had a purpose and was as well crafted as I could for the amount of time I had
remaining. My philosophy during this phase was to Question Everything! A few major areas that emerged in this phase were:

- Line-by-Line examination
- Minimize dependencies on concrete implementations (use interfaces)
- Added unit testing -- i waited until this phase because I was unsure of the volatility of the overall structure of the program until this point

## Conclusion

Now I am fully aware that I am fortunate to work for someone who understands the need for this kind of work and that the value added
may not be realized instantaneously (other than the fixed bugs of course) but will be realized over the time that the application is in use
and the requirements change. Not everyone gets this luxury, so the best thing to do is to simply take pride in your work and write clean code from the start.