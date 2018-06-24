# steamx-api

![Build Status](https://drone.dayler.io/api/badges/iknpx/steamx-api/status.svg)

### Events

* ``'fetch apps' | [<steam app id>]`` - fetch apps details
* ``'fetch persons' | [<steam user string>]`` - fetch steam users

### Subsriptions
* ``'apps' | [{steam app}]``
* ``'persons' | [{steam user}]``
* ``'resolve next' | {<resolved steam app>}``
* ``'resolve done' | [void]``
