// ## File: packages/ddd-kit/src/http/status.ts

// This module centralizes and re-exports HTTP utilities from the `stoker` library,
// providing a single, consistent source for status codes, phrases, and other
// helpers across all applications that consume this SDK.

import * as HttpStatus from "stoker/http-status-codes";
import * as HttpPhrases from "stoker/http-status-phrases";
export { jsonContent as openapiJsonContent } from "stoker/openapi/helpers";

export { HttpPhrases, HttpStatus };
