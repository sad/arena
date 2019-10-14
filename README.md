# arena
**arena** is a work in progress site that allows people to beat battle one another easily. a sample and/or ruleset will be provided, and users will be tasked to make a beat in a certain time period that uses the sample and/or conforms to the rules. once the time limit has lapsed, a voting phase will begin which will allow users to vote on who made the best beat.

### requirements
- nodejs >= 11.0
- mongodb
- yarn

### installing
```sh
$ yarn
$ yarn run config
$ yarn run start
```

### permission nodes
```
- can_create_battles
- can_view_battles
- can_participate_battles
- can_suggest_rules
- can_view_profiles
- can_edit_profile
- can_view_ops
- can_view_ops_stats
- can_change_bulletin
- can_view_ops_sys
- can_view_ops_battles
- can_view_ops_invites
- can_view_ops_users
- can_set_group
- can_create_group
- can_edit_group
- can_delete_group
- can_manage_badges
- can_create_invites
- can_create_invites_infinite
- can_delete_invites_own
- can_delete_invites_all
```
