const assert = require('assert');
const builder = require('../index');

it('SELECT TOP 20 c.id, c.age FROM c WHERE c.id = "200" ORDER BY c.createdAt DESC', () => {
  const querySpec = builder.query(
    'SELECT %l %c FROM %t WHERE %w %o',
    'c',
    20,
    ['id', 'age'],
    {
      id: {
        op: '=',
        type: 'string',
        value: 200,
      },
    },
    {
      sort: 'desc',
      key: 'createdAt'
    }
  );
  assert(querySpec.query.match(/SELECT TOP @_top c.id, c.age FROM c WHERE \( c.id = @id[0-9]+ \) ORDER BY c.createdAt desc/));
  assert.equal(querySpec.parameters[0].value, 20);
  assert.equal(querySpec.parameters[1].value, '"200"');
});

it('SELECT TOP 20 c.age FROM c WHERE c.id > 200', () => {
  const querySpec = builder.query(
    'SELECT %l %c FROM %t WHERE %w %o',
    'c',
    20,
    ['age'],
    {
      id: {
        op: '>',
        value: 200,
      }
    },
    {
      sort: 'desc',
      key: 'createdAt'
    }
  );
  assert(querySpec.query.match(/SELECT TOP @_top c.age FROM c WHERE \( c.id > @id[0-9]+ \) ORDER BY c.createdAt desc/));
  assert.equal(querySpec.parameters[0].value, 20);
  assert.equal(querySpec.parameters[1].value, 200);
});

it('SELECT * FROM c WHERE NOT IS_DEFINED(c.lastViewedAt) AND c.createdAt < 12345 AND c.id != "100"', () => {
  const querySpec = builder.query(
    'SELECT * FROM %t WHERE %w',
    'c',
    {
      lastViewedAt: {
        func: 'NOT IS_DEFINED',
      },
      createdAt: {
        op: '<',
        value: 12345,
      },
      id: {
        op: '!=',
        value: 100,
        type: 'string',
      }
    }
  );
  assert(querySpec.query.match(/SELECT \* FROM c WHERE \( NOT IS_DEFINED\(c.lastViewedAt\) AND c.createdAt < @createdAt[0-9]+ AND c.id != @id[0-9]+/));
  assert.equal(querySpec.parameters[0].value, 12345);
  assert.equal(querySpec.parameters[1].value, '"100"');
});

it('SELECT * FROM c WHERE (c.age = 20) AND (c.createdAt < 12345 OR c.id != "100")', () => {
  const querySpec = builder.query(
    'SELECT * FROM %t WHERE %w',
    'c',
    {
      AND: {
        age: 20,
        OR: {
          createdAt: {
            op: '<',
            value: 12345,
          },
          id: {
            op: '!=',
            value: 100,
            type: 'string',
          }
        }
      },
    }
  );
  assert(querySpec.query.match(/SELECT \* FROM c WHERE \( \( c.age = @age[0-9]+ AND \( c.createdAt < @createdAt[0-9]+ OR c.id \!= @id[0-9]+ \) \) \)/));
  assert.equal(querySpec.parameters[0].value, 20);
  assert.equal(querySpec.parameters[1].value, 12345);
  assert.equal(querySpec.parameters[2].value, '"100"');
});

it('SELECT * FROM c WHERE id = "AndersenFamily"', () => {
  const querySpec = builder.query(
    'SELECT * FROM %t WHERE %w',
    'c',
    { id: 'AndersenFamily' }
  );
  assert(querySpec.query.match(/SELECT \* FROM c WHERE \( c.id = @id[0-9]+ \)/));
  assert.equal(querySpec.parameters[0].value, 'AndersenFamily');
});

it('SELECT c.id, IS_DEFINED(c.viewed) viewed FROM c', () => {
  const querySpec = builder.query(
    'SELECT %c FROM %t',
    'c',
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
  assert(querySpec.query.match(/SELECT c.id, IS_DEFINED\(c.viewed\) viewed FROM c/));
});


it('SELECT * FROM c WHERE ARRAY_CONTAINS(c.name, "bar")', () => {
  const querySpec = builder.query(
    'SELECT * FROM %t WHERE %w',
    'c',
    {
      name: {
        func: 'ARRAY_CONTAINS',
        value: 'bar',
      }
    }
  );
  assert(querySpec.query.match(/SELECT \* FROM c WHERE \( ARRAY_CONTAINS\(c.name, @name[0-9]+\) \)/));
});

it('SELECT * FROM c WHERE c.flag = true', () => {
  const querySpec = builder.query(
    'SELECT * FROM %t WHERE %w',
    'c',
    { flag: { type: 'boolean', value: true } }
  );
  assert(querySpec.query.match(/SELECT \* FROM c WHERE \( c.flag = @flag[0-9]+ \)/));
  assert(typeof querySpec.parameters[0].value, typeof Boolean(1));
});
