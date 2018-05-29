# CosmosDB Query Builder

An yet another CosmosDB(DocumentDB) query builder which inspired by [SQL::Format](https://metacpan.org/pod/SQL::Format).

## SYNOPSIS

Pass the format, a table name, and your binding parameters.

```js
const builder = require('cosmosdb-query-builder');
const querySpec = builder.query(
  'SELECT %l %c FROM %t WHERE %w %o',
  20,
  ['id', 'age'],
  'c',
  { id: 200 },
  {
    order: {
      sort: 'desc',
      key: 'createdAt'
    }
  }
);

console.log(querySpec);
/*
  { query: 'SELECT TOP @_top c.id, c.age FROM c WHERE ( c.id = @id588 ) ORDER BY c.createdAt desc',
  parameters:
   [ { name: '@_top', value: 20 },
     { name: '@id588', value: '200' } ] }
*/

const queryIterator = this.documentClient.queryDocuments(this.collectionUrl, querySpec);
// Enjoy!
```

## Operators

### %l

Limit (means `TOP`).

```js
builder.query('SELECT %l * FROM c', 'c', 20);
// 'SELECT TOP @_top * FROM c'
```

### %c

Columns which processed "table" prefix.

```js
builder.query('SELECT %c FROM c', 'c', ['id', 'age']);
// 'SELECT c.id, c.age FROM c'
```

You can use any functions (set as `func` due to reserved word).

```js
builder.query('SELECT %c FROM c', 'c',
  [
    {
      1: {
        function: 'COUNT',
        alias: 'count'
      }
    }
  ]
);
// 'SELECT COUNT(1) count FROM c'

builder.query('SELECT %c FROM c', 'c',
  [
    'id',
    {
      viewed: {
        func: 'IS_DEFINED',
        alias: 'viewed'
      }
    }
  ]
);
// 'SELECT c.id, IS_DEFINED(c.viewed) viewed FROM c'
```

### %t

Replace table name. Unfortunately, currently there is almost no meaning!

```js
builder.query('SELECT * FROM %t', 'c');
// 'SELECT * FROM c'
```

### %w

Where clauses. You can specify it various ways.  
Also there will be added "table" prefix.

Simplest one:
```js
builder.query(
  'SELECT * FROM c WHERE %w', 'c',
  { id: 'AndersenFamily' }
);
// 'SELECT * FROM c WHERE c.id = "AndersonFamily"'
```

Specify operator:
```js
builder.query(
  'SELECT * FROM c WHERE %w', 'c',
  { id: {
      op: '>',
      value: 1000
    } 
  }
);
// 'SELECT * FROM c WHERE c.id > 1000'
```

Specify type (default: string):
```js
builder.query(
  'SELECT * FROM c WHERE %w', 'c',
  { id: {
      type: 'string',
      value: 1000
    } 
  }
);
// 'SELECT * FROM c WHERE c.id = "1000"'
```

Functions (set as `func` due to reserved word):
```js
builder.query(
  'SELECT * FROM c WHERE %w', 'c',
  { 
    viewed: {
      func: 'NOT IS_DEFINED',
    } 
  }
);
// 'SELECT * FROM c WHERE NOT IS_DEFINED(c.viewed)'
```

AND/OR (Can be nest):
```js
builder.query(
  'SELECT * FROM c WHERE %w', 'c',
  {
    OR: {
      id: 1000,
      age: 20,
    }
  }
);
// 'SELECT * FROM c WHERE c.id = "1000" OR age = "20"'
```

### %o

Order options. A default sort order is `desc`.
```js
builder.query(
  'SELECT * FROM c %o', 'c',
  {
    sort: 'desc',
    key: 'createdAt'
  }
);
// 'SELECT * FROM c ORDER BY c.createdAt DESC
```

## NOTES

- Currently JOIN and GROUP options is not supported (Welcome to your PR!)
