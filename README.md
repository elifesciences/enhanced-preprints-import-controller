# enhanced-preprints-import-controller

This is a UI built to make manual article import easy for humans outside the tech team.

To run the application for development purposes, you need to spin up the local version of epp-import with real s3 as a source. Then run `yarn start:dev`, and go to `localhost:5000`.

The dashboard will be available at [http://localhost:5000](http://localhost:5000).

## API Usage

### Import DocMap

You can trigger a DocMap import using curl:

```bash
curl -X POST http://localhost:5000/import-docmap \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "docmap=https://example.com/docmap.json" \
  -d "temporalNamespace=your-namespace"
```

Or using JSON:

```bash
curl -X POST http://localhost:5000/import-docmap \
  -H "Content-Type: application/json" \
  -d '{
    "docmap": "https://example.com/docmap.json",
    "temporalNamespace": "your-namespace"
  }'
```

Replace `https://example.com/docmap.json` with the actual URL to your DocMap file and `your-namespace` with the appropriate Temporal namespace.
