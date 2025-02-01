import { expect } from 'chai';
import is from 'is-my-json-valid';
import numberType from '../../../src/lib/types/number.mjs';

function isMultipleOf(schema) {
  return is(schema)(numberType(schema));
}

describe('Number Generator', () => {
  it('should return number with a fractional part', () => {
    const n = numberType({});
    const m = Math.floor(n);

    expect(n).not.to.eql(m);
  });

  it('should return number with large minimum without specified maximum', () => {
    const n = numberType({ minimum: 1682899200000 });

    expect(n).to.be.a('number');
    expect(n).to.be.at.least(1682899200000);
  });

  it('should handle multipleOf on integers', () => {
    expect(isMultipleOf({ multipleOf: 1 })).to.be.true;
    expect(isMultipleOf({ multipleOf: 1, maximum: 1e+31 })).to.be.true;
  });

  it('should handle multipleOf on decimals', () => {
    expect(isMultipleOf({ multipleOf: 0.00000001, maximum: 1000000000 })).to.be.true;
    expect(isMultipleOf({ multipleOf: 0.000001, maximum: 1000000000 })).to.be.true;
    expect(isMultipleOf({ multipleOf: 0.01, minimum: 7, maximum: 10 })).to.be.true;
    expect(isMultipleOf({ multipleOf: 0.01, minimum: 0, maximum: 1 })).to.be.true;
    expect(isMultipleOf({ multipleOf: 8, minimum: 80, maximum: 90 })).to.be.true;
  });

  it('should return 1', () => {
    let n = numberType({ type: 'integer', minimum: 0, maximum: 1 });
    while (n !== 1) {
      n = numberType({ type: 'integer', minimum: 0, maximum: 1 });
    }
    expect(n).to.eq(1);
  });

  describe('should ignore min and max if using Number.MAX_VALUE in then', () => {
    it('ignoring minimum', () => {
      const n = numberType({ minimum: -Number.MAX_VALUE });

      expect(n).to.be.a('number');
      expect(n).to.not.be.NaN;
      expect(n).to.not.be.eq(Infinity);
    });

    it('ignoring minimum', () => {
      const n = numberType({ maximum: Number.MAX_VALUE });

      expect(n).to.be.a('number');
      expect(n).to.not.be.NaN;
      expect(n).to.not.be.eq(Infinity);
    });

    it('ignoring both', () => {
      const n = numberType({ minimum: -Number.MAX_VALUE, maximum: Number.MAX_VALUE });

      expect(n).to.be.a('number');
      expect(n).to.not.be.NaN;
      expect(n).to.not.be.eq(Infinity);
    });
  });
});
