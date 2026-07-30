# Provenance Model

Every external source is registered independently from lexical output.

Required source fields include:

- stable source ID and source-record ID;
- source name and responsible organization;
- source URL and terms URL;
- version and retrieval date;
- license ID and attribution text;
- redistribution and ShareAlike flags;
- transformation history and use mode.

Lexical records reference source IDs rather than embedding an undocumented copy of a source layer. Build manifests hash every declared input and output so a published artifact can be traced to an exact source snapshot and transformation run.

Status values such as `evidence`, `candidate`, `approved`, and `rejected` should remain explicit in downstream review systems. This repository generates candidates but does not convert them into approved editorial content.
