# Scenario
## Wordpress setup
In this scenario we will setup a working wordpress.

This will require you to setup:
- a running apache server on port 80
- a mysql database server on ...
- a user ubuntu

```bash
apt-get install -y apache2
```

Please wait till the machine ubuntu is booted

@vm: ubuntu has name am
- provider: bluebox
- type: vm
- image: precise64

To make sure we have an up to date package list , we will update the apt sources.

@action: apt-update
- type: exec
- command: `apt-get update -y`

## Ubuntu login works
As a first step we will see if we can login as the user ubuntu.

@check: ubuntu.exists
- type: exec
- command: `id -a`

## Apache User setup
Then we create a user apache

@check: user.apache.exists
- type: exec
- command: `id -a apache`

## We need some more
```ruby
github bla $?
echo "alalal"
apt-get install -y ubuntu
aptitude search blalblal
```

# Actions

# Checks

# Hardware

# Todo
- runlist
- output **info**
- re-use a check/action with params
- limit chars in ids of action/checks
- params alway to have a key/value

- runlist across header/tasks

- combi objects
