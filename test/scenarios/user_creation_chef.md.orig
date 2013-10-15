# Scenario
## User creation with chef
### Description:
Today we are going to focus on the user creation with chef

A user typically consists of a:

- username: used to login with
- uid: unique id that identifies the user
- homedirectory: the directory where the user lives
- primary group: integer that is the group id

### Exercise:
- @setting: [An ubuntu user](#settings-ubuntu-user)

[An ubuntu user](#settings-ubuntu-user)
[An ubuntu user](http://vlablal.com#settings-ubuntu-user)

<http://vlablal.com#settings-ubuntu-user>

<http://sos.be>

Let's see if you can create a user ubuntu with:

- uid: 1000
- gid: 1000
- username: ubuntu
- homedir: /home/ubuntu

I'll be waiting until you finish the job ...

- @check: [Is user created?](#check-user-created)

Related resources are:
- [User Resource Provider](http://docs.opscode.com/resource_user.html)
- [Group Resource Provider](http://docs.opscode.com/resource_group.html)


### Solution:

- @action: [Create user with chef](#action-user-create)

# Actions
## action-user-create
- type: exec
- command: @codeblock

```ruby
group "{{{ scenario.group }}}" do
  gid "{{{ scenario.gid }}}"
end

user "{{{ scenario.username }}}" do
  uid     "{{{ scenario.uid }}}"
  homedir "{{{ scenario.homedir }}}"
  gid     "{{{ scenario.gid }}}"
  action :create
end
```

# Checks
## check-user-created
- type: exec
- command: @codeblock
- user: {{{ scenario.username }}}

```
# Any error will cause this script to fail
set -x

# Check that our username is correct
id -un  | grep -w {{{ scenario.username }}}

# Check uid
id -u  | grep -w {{{ scenario.uid }}}

# Check primary group
id -gn | grep -w  {{{ scenario.group }}}

# Check primary gid
id -g | grep -w {{{ scenario.gid }}}

# Check homedirectory
getent passwd {{{ scenario.username }}} | cut -d ':' -f 6 | grep -w {{{ scenario.homedir }}}
```

# Settings
## setting-ubuntu-user
- username: 'ubuntu'
- homedir: '/home/ubuntu'
- group: admins
- uid: 3000
- gid : 3000
