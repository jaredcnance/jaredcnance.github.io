---
layout: post
title:  "CI of Dockerized .Net Core Applications To Azure Container Service via VSTS"
date:   2016-10-12 00:00:00 -0500
categories: dotnet core docker
comments: true
---

## Introduction

If you're reading this then I'm sure you've been hearing about Docker and .Net Core. 
There are plenty of guides out there already describing how to get a .Net Core application running in a docker container.
This is not the goal of this post. 
The focus of this post is on the steps AFTER you have a working application running in Docker and are ready to deploy your image.

In this example, I will describe the steps required to deploy a dockerized application to Azure Container Service running Docker Swarm using VSTS.
If you've been using Docker and are not familiar with Swarm, take a quick peek at this [video](https://www.youtube.com/watch?v=EC25ARhZ5bI) which should give you all the context you need to get up and running.

### Pre-Requisites

You will need to be at least partially familiar with all of these for this to be beneficial to you:

- .Net Core
- Docker / Docker-Compose / Docker-Swarm

I will get into some specifics regarding the following, but many of the concepts covered are applicable to other deployment methods:

- VSTS (Visual Studio Team Services)
- Azure Container Service

### Provision the Azure Container Service

I found [this blog](https://ahmetalpbalkan.com/blog/docker-swarm-azure/) by Ahmet Alp Balkan to be a pretty good explanation of how to actually provision Docker Swarm in Azure Container Service.
Once you get through that and can SSH into your swarm master, try doing the following from your dev machine. 
Make note of the swarm master name in Azure (something like "swarm-master-40001ADC-0").
Remember to replace all instances of {HOST}, {USER}, and {SWARM_MACHINE_NAME} with the actual values.

{% highlight bash %}
$ docker info
$ ssh -L 2375:{SWARM_MACHINE_NAME}:2375 -N {USER}@{HOST} -p 2200 &
$ export DOCKER_HOST=:2375
$ docker info
{% endhighlight %}

Okay, let's break down what we're doing. 
The first line is just getting the current [docker info](https://docs.docker.com/engine/reference/commandline/info/). 
The info displayed here is for the docker installation on your dev machine.

Next, we open an SSH tunnel from your local port 2375 to the remote port 2375 on the docker swarm machine via port 2200.

In line 3, we're setting the environment variable [DOCKER_HOST](https://docs.docker.com/compose/production/#/running-compose-on-a-single-server) to port 2375.

The final line is calling `docker info` again, but if everything works correctly, you should see docker info for the swarm rather than your local machine.
There should be a section called "nodes" that gives you information about each of the swarm agents.

```
Nodes: 1
 swarm-agent-40001ADC000000: 10.0.0.4:2375
  └ Status: Healthy
  └ Containers: 0
  └ Reserved CPUs: 0 / 2
  └ Reserved Memory: 0 B / 7.145 GiB
  └ Labels: executiondriver=, kernelversion=3.19.0-65-generic, operatingsystem=Ubuntu 14.04.4 LTS, storagedriver=aufs
  └ Error: (none)
  └ UpdatedAt: 2016-10-12T18:56:37Z
```

Now, if you'd like to kill the ssh tunnel and reset your docker host, just do the following:

{% highlight bash %}
$ kill -9 `lsof -t -i :2375`
$ export DOCKER_HOST=
{% endhighlight %}

**Remember DOCKER_HOST is an environment variable and will not be persisted across terminal sessions**

### Deploying the Application

#### Provisioning a VSTS Build Machine
If you're using VSTS you'll need to provision a [Linux build agent described here](http://donovanbrown.com/post/2016/06/03/Building-a-Linux-Based-Visual-Studio-Team-Service-Build-Machine-with-Docker-Support).

We'll also want to make sure that we can run docker without sudo. 
So, [update the docker permissions](https://docs.docker.com/engine/installation/linux/ubuntulinux/#/create-a-docker-group) from the build machine.

{% highlight bash %} 
$ sudo groupadd docker
$ sudo usermod -aG docker $USER
# You may need to reboot
$ sudo reboot
{% endhighlight %}

Now at the time of this writing, there are already 2 different Docker integrations available for VSTS ([Docker Integration](https://marketplace.visualstudio.com/items?itemName=ms-vscs-rm.docker) and [Docker Build Task](https://marketplace.visualstudio.com/items?itemName=lambda3.lambda3docker)).
I tried both of them, but decided neither would suffice for what I was trying to do. Also, both require giving up your private key. 

So, since we're not going to use either integration, let's start by making sure our build machine can talk to our swarm master. To do this, you can SSH into the build machine by running the following:

{% highlight bash %}
$ docker-machine ssh {BUILD_MACHINE}
{% endhighlight %}

Once we're inside, we need to generate some keys so that we can SSH from the build machine to the docker swarm master. 
Run the following **from the build machine**:

{% highlight bash %}
$ ssh-keygen
{% endhighlight %}

As you go through the prompts, _DO NOT ENTER A PASSPHRASE_ for the key file as it will prevent us from automating the process.

- Copy the contents of the public key file (excluding the user@host at the end)

{% highlight bash %}
$ cat ~/.ssh/id_rsa.pub
{% endhighlight %}

**From your dev machine**, SSH into the swarm master and add public key to the authorized_keys file. Run the following **from the swarm master machine**

{% highlight bash %}
$ nano ~/.ssh/authorized_keys
{% endhighlight %}

Now, you should be able to create an SSH tunnel from the build machine to the docker swarm master. Check by running the following **from the build machine**:

{% highlight bash %}
$ ssh -L 2375:{SWARM_MACHINE_NAME}:2375 -N {USER}@{HOST} -p 2200 &
$ lsof -i :2375
{% endhighlight %}

which should output something like the following:

```
docker-user@dockerbuildmachine:~$ ssh -L 2375:{SWARM_MACHINE_NAME}:2375 -N {USER}@{HOST} -p 2200 &
[1] 16102
docker-user@dockerbuildmachine:~$ lsof -i :2375
COMMAND   PID        USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
ssh     16102 docker-user    4u  IPv6 119527      0t0  TCP ip6-localhost:2375 (LISTEN)
ssh     16102 docker-user    5u  IPv4 119528      0t0  TCP localhost:2375 (LISTEN)
docker-user@dockerbuildmachine:~$
```

You can go ahead and kill the tunnel by running 

{% highlight bash %}
$ kill -9 `lsof -t -i :2375`
{% endhighlight %}

#### Create The Build Defintion

Okay, so now we have a build machine that can securely communicate with our Docker Swarm Master. 
The next thing we want to do is create a build definition.
My build definition looks something like this:

![Add Build Definition]({{ site.url }}/assets/101216_buildDefinition.png)

All of the steps are self explanatory except the last two which are executing a shell script called deploy.sh. 
This is actually just the bash script used by [Docker build Tasks](https://github.com/Lambda3/vsts-build-task-docker) that 
[I modified](https://gist.github.com/jaredcnance/8c6083041088794c985efaa6d62cb0bf) so that I wouldn't need to specify the private key in the task configuration.
I also had to add a sudo to [this](https://github.com/Lambda3/vsts-build-task-docker/blob/master/lambda3docker/dockerTask.sh#L36), you can reference [this issue](https://github.com/Lambda3/vsts-build-task-docker/issues/5) for more.

I created a copy of my version [here](https://gist.github.com/jaredcnance/8c6083041088794c985efaa6d62cb0bf). 
I strongly encourage you to take a look at the script and get a good understanding of what it is doing. 
In the near future I plan on doing a re-write of this script to better suit my purposes. 

Simply add it to your project, update project.json so that it will include it when publishing:

 {% highlight json %}
 { 
   "publishOptions": {
      "includeFiles": [
        "appsettings.json",
        "deploy.sh"
      ]
    }
 }
 {% endhighlight %}

You will need to add two shell script tasks with the following arguments:
 
1. Build:
  - Script Path: src/{MY_APP}/bin/release/netcoreapp1.0/publish/deploy.sh
  - Arguments: `--build --image {IMAGE_NAME}`

2. Compose:
  - Script Path: src/{MY_APP}/bin/release/netcoreapp1.0/publish/deploy.sh
  - Arguments: `--compose --env Debug --server {HOST} --port 2200 --user {USER} --project {PROJECT_NAME}`


The first task ensures that the image gets rebuilt with every deployment and the second will run `docker-compose up` on the swarm to run the application containers.

And that's it! You can verify the containers have been deployed by running the following **from your dev machine**:

{% highlight bash %}
$ ssh -L 2375:{SWARM_MACHINE_NAME}:2375 -N {USER}@{HOST} -p 2200 &
$ export DOCKER_HOST=:2375
$ docker info
$ docker ps -a
{% endhighlight %}

An alternative approach would be to zip the publish folder and publish it as an artifact and then run the docker scripts from a release definition.

Please be sure to leave any comments regarding issues you may have or things I may have left out.

## Other References

These are just a few links that I found helpful while I was figuring this out for myself:

* [VIDEO: Docker Swarm by Victor Vieux](https://www.youtube.com/watch?v=EC25ARhZ5bI)
* [Create a Docker Swarm cluster using Azure Container Service](https://blogs.msdn.microsoft.com/jcorioland/2016/04/25/create-a-docker-swarm-cluster-using-azure-container-service/)
* [Azure Docker Swarm](https://ahmetalpbalkan.com/blog/docker-swarm-azure/)
* [Building .NET Core Linux Docker Images with Visual Studio Team Services](https://blogs.msdn.microsoft.com/stevelasker/2016/06/13/building-net-core-linux-docker-images-with-visual-studio-team-services/)
* [Running your ASP.NET Core application on Azure Container Service](https://roadtoalm.com/2016/10/05/running-your-asp-net-core-application-on-azure-container-service/)
* [Running a container image in Azure Container Service from Visual Studio Team Services](https://blogs.msdn.microsoft.com/dmx/2016/09/27/running-a-container-image-in-azure-container-service-from-visual-studio-team-services/)
* [How To Use Your Own Registry](https://blog.docker.com/2013/07/how-to-use-your-own-registry/)
* [Deploying Your Own Private Docker Registry on Azure](https://azure.microsoft.com/en-us/documentation/articles/virtual-machines-linux-docker-registry-in-blob-storage/)
