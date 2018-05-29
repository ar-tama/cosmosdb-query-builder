const METHOD_MAP = {
  '%c': 'column',
  '%t': 'table',
  '%w': 'where',
  '%l': 'limit',
  '%o': 'order',
};

class QueryBuilder {
  /**
   * Generate a querySpec object
   * @param {!String} format - A query string format
   * @param {!table} table - A table name
   * @param {Object|Array|String} - Bind parameters
   * @returns {SqlQuerySpec} - A full querySpec object which can pass to documentClient
   */
  static query(format, table, ...binds) {
    const tokens = format.split(' ');
    const tokenResults = [];
    const bindResults = [];
    let bindIndex = 0;

    for (let token of tokens) {
      // barewords
      if (!token.match(/%[cwol]/)) {
        tokenResults.push(token);
        continue;
      }
      const method = METHOD_MAP[token];
      const res = this[method](table, binds[bindIndex]);
      bindIndex++;
      if (!res) {
        continue;
      }
      if (res.token) {
        tokenResults.push(res.token);
      }
      if (res.bind) {
        if (isArray(res.bind)) {
          bindResults.push(...res.bind);
        } else {
          bindResults.push(res.bind);
        }
      }
    }
    const query = tokenResults.join(' ').replace('%t', table);
    return {
      query: query,
      parameters: bindResults,
    }
  }

  static column(table, params) {
    if (!isArray(params)) {
      return;
    }
    const columns = [];
    for (let p of params) {
      if (isString(p)) {
        columns.push(`${table}.${p}`);
        continue;
      }
      if (!isObject(p)) {
        continue;
      }
      for (let key in p) {
        const { func, alias } = p[key];
        if (!func) {
          continue;
        }
        const column = `${func}(${table}.${key})`;
        if (alias) {
          columns.push(column + ` ${alias}`);
        } else {
          columns.push(column);
        }
      }
    }
    return {
      token: columns.join(', '),
    };
  }

  static where(table, params, cond) {
    const tokens = [];
    const binds = [];
    const condition = cond ? ` ${cond} ` : ' AND '; // AND | OR

    for (let key in params) {
      const placeholder = `@${generateRandomKey(key)}`;

      if (!isObject(params[key])) { // key = value
        tokens.push(`${table}.${key} = ${placeholder}`);
        binds.push({
          name: placeholder,
          value: `${params[key]}`,
        });
        continue;
      }
      if (key.match(/AND|OR/)) {
        const res = this.where(table, params[key], key);
        tokens.push(res.token);
        binds.push(...res.bind);
        continue;
      }
      if (params[key].func) {
        if (params[key].value) {
          tokens.push(`${params[key].func}(${table}.${key}, ${placeholder})`);
          binds.push({
            name: placeholder,
            value: params[key].value,
          });
        } else {
          tokens.push(`${params[key].func}(${table}.${key})`);
        }
        continue;
      }
      
      const op = params[key].op || '=';
      const type = params[key].type || '';
      const value = params[key].value;
      tokens.push(`${table}.${key} ${op} ${placeholder}`);
      if (type.toLowerCase() == 'string' || isString(value)) {
        binds.push({
          name: placeholder,
          value: `"${value}"`, // quote
        });
      } else if (type.toLowerCase() == 'number' || isNumber(value)) {
        binds.push({
          name: placeholder,
          value: Number(value),
        });
      } else {
        binds.push({
          name: placeholder,
          value: value,
        });
      }
    }
    return {
      token: `( ${tokens.join(condition)} )`,
      bind: binds,
    };
  }

  static limit(table, params) {
    if (isNumber(params)) {
      return {
        token: 'TOP @_top',
        bind: {
          name: '@_top',
          value: params
        },
      };
    }
  }

  static order(table, params) {
    if (!params.key) {
      return null;
    }
    const order = (params.sort) ? params.sort : 'DESC';
    return {
      token: `ORDER BY ${table}.${params.key} ${order}`
    };
  }
}

module.exports = QueryBuilder;

function isString(p) {
  return (typeof p === typeof '' && !isNumber(p));
}
function isNumber(p) {
  return (typeof p === typeof 0);
}
function isArray(p) {
  return (typeof p === typeof {} && isNumber(p.length));
}
function isObject(p) {
  return (typeof p === typeof {} && p.length === undefined);
}
function generateRandomKey(key) {
  return key + Math.floor(Math.random() * 1000).toString();
}
