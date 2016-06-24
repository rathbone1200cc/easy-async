
# v1 - June 2016

*Breaking changes!*

To prevent confusion with [promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise), the easy-async methods `then`, and `and` have been renamed to `thenStart` and `andStart`.

Unlike the previous version, by default, tasks declared with `start`, `thenStart`, and `andStart` will not be wrapped with a try/catch block.  There is a new option `wrapWithTry` that will provide the wrapping.

Also unlike the previous version, easy-async in v1 will not continue with later tasks after an error is encountered.
