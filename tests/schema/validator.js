import tv4 from 'tv4';
import clone from 'clone';
import semver from 'semver';
import ZSchema from 'z-schema';
import JaySchema from 'jayschema';

function addValidators(v) {
  const registry = v.addFormat || v.registerFormat;
  const msgOnFail = !v.registerFormat;

  registry.call(v, 'semver', value => {
    let pass;
    let err;

    try {
      pass = semver.valid(value) === value;
    } catch (e) {
      err = e.message;
    }

    if (msgOnFail) {
      // tv4, Jayschema
      if (pass) return null;
      return err;
    }

    // ZSchema
    return pass;
  });
}

export function checkType(sample, type) {
  const test = Object.prototype.toString.call(sample).match(/object (\w+)/);

  if (test[1].toLowerCase() !== type) {
    throw new Error(`Expected ${JSON.stringify(sample)} to be ${type}`);
  }
}

export function checkSchema(sample, schema, refs) {
  const fail = [];
  const fixed = {};

  if (refs) {
    refs.forEach(s => {
      fixed[s.id.split('#')[0]] = clone(s);
    });
  }

  // z-schema
  const validator = new ZSchema({
    ignoreUnresolvableReferences: false,
  });

  Object.keys(fixed).forEach(k => {
    validator.setRemoteReference(k, fixed[k]);
  });

  let valid;

  try {
    valid = validator.validate(clone(sample), clone(schema));
  } catch (e) {
    fail.push(e.message);
  }

  const errors = validator.getLastErrors();

  if (errors || !valid) {
    fail.push(errors.map(e => {
      if (e.code === 'PARENT_SCHEMA_VALIDATION_FAILED') {
        return e.inner.map(x => x.message).join('\n');
      }

      return e.message;
    }).join('\n') || `Invalid schema ${JSON.stringify(sample)}`);
  }

  // tv4
  const api = tv4.freshApi();

  api.banUnknown = false;
  api.cyclicCheck = false;

  Object.keys(fixed).forEach(k => {
    api.addSchema(k, fixed[k]);
  });

  let result = api.validateResult(sample, clone(schema), api.cyclicCheck, api.banUnknown);

  if (result.missing.length) {
    fail.push(`Missing ${result.missing.join(', ')}`);
  }

  if (result.error) {
    fail.push(result.error);
  }

  // jayschema
  const jay = new JaySchema();

  addValidators(jay);

  Object.keys(fixed).forEach(k => {
    jay.register(clone(fixed[k]));
  });

  result = jay.validate(sample, clone(schema));

  if (result.length) {
    fail.push(result.map(e => e.desc || e.message).join('\n') || 'Invalid sample');
  }

  if (fail.length) {
    const a = JSON.stringify(sample, null, 2);
    const b = JSON.stringify(schema, null, 2);

    throw new Error(`Given sample does not match schema.\n${fail.join('\n')}\n---\n${a}\n---\n${b}\n---\n`);
  }
}

[tv4, ZSchema].map(addValidators);
