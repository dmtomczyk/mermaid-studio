# Flowchart examples

```mermaid
flowchart LR
    A[Start] --> B{Valid?}
    B -->|yes| C([Process])
    B -.->|no| D[(Database)]
    subgraph Services
        C --> D
    end
```

Common patterns:
- `A[Label]` rectangle
- `A([Label])` rounded node
- `A((Label))` circle
- `A{Label}` decision/diamond
- `A[(Label)]` database
- `A --> B` solid edge
- `A -.-> B` dotted edge
- `A -->|label| B` labeled edge
