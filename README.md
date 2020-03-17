# steamx-api

### Events

* ``'fetch apps' | [<steam app id>]`` - fetch apps details
* ``'fetch persons' | [<steam user string>]`` - fetch steam users
* ``'clear apps ' | [<steam app id>]`` - remove loaded apps

### Subsriptions
* ``'apps' | [{steam app}]``
* ``'persons' | [{steam user}]``
* ``'resolve next' | {<resolved steam app>}``
* ``'resolve done' | [void]``
