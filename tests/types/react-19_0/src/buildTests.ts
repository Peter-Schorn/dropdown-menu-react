// MARK: build-time tests; not meant to be imported

// ensure the library is not leaking global CSS declarations by importing a CSS
// file that would cause a type error if the global declarations were not
// properly scoped to the library

// @ts-expect-error
import "./testCSS.css";
