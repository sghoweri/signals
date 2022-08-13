import { computed, reactive } from "@preact/signals-core";

describe("reactive()", () => {
	it("should track property access", () => {
		const obj = reactive({ foo: 1, bar: 2 });
		const r = computed(() => obj.foo);
		expect(r.value).to.equal(1);

		obj.foo++;
		expect(r.value).to.equal(2);
	});

	it("should track nested property access", () => {
		const obj = reactive({ foo: { bar: 1 } });
		const r = computed(() => obj.foo.bar);
		expect(r.value).to.equal(1);

		obj.foo.bar++;
		expect(r.value).to.equal(2);
	});

	it("should dynamically create reactives", () => {
		const obj = reactive({ foo: { bar: 1 } });
		const r = computed(() => obj.foo.bar);
		expect(r.value).to.equal(1);

		obj.foo = { bar: 2 };
		expect(r.value).to.equal(2);

		// Check if it's really reactive
		obj.foo.bar++;
		expect(r.value).to.equal(3);
	});

	describe("Object", () => {
		it("should track property additions", () => {
			const obj = reactive({ foo: 1 } as any);

			const spy = sinon.spy(() => obj.foo);
			const a = computed(spy);
			expect(a.value).to.equal(1);

			const b = computed(() => obj.bar);
			expect(b.value).to.equal(undefined);

			spy.resetHistory();

			(obj as any).bar = 2;
			expect(b.value).to.equal(2);
		});

		it("should track property deletions", () => {
			const obj = reactive({ foo: 1 } as any);
			const a = computed(() => obj.foo);
			expect(a.value).to.equal(1);

			delete obj.foo;
			expect(a.value).to.equal(undefined);
			expect("foo" in obj).to.equal(false);

			// Add property back again
			obj.foo = 1;
			expect(a.value).to.equal(1);
		});

		it("should forbid __proto__", () => {
			const obj = reactive({ foo: 1 } as any);
			const a = computed(() => obj.__proto__);
			expect(a.value).to.equal(undefined);

			obj.__proto__ = "foobar";
			expect(a.value).to.equal(undefined);
		});

		describe("Methods", () => {
			// FIXME: Doesn't re-run when new property is added
			it.skip("should track Object.keys()", () => {
				const obj = reactive({ foo: 1, bar: 2 });
				const r = computed(() => Object.keys(obj));
				expect(r.value).to.deep.equal(["foo", "bar"]);

				(obj as any).baz = 3;
				expect(r.value).to.deep.equal(["foo", "bar", "baz"]);
			});

			it("should track Object.values()", () => {
				const obj = reactive({ foo: 1, bar: 2 });
				const r = computed(() => Object.values(obj));
				expect(r.value).to.deep.equal([1, 2]);

				obj.foo = 42;
				expect(r.value).to.deep.equal([42, 2]);
			});

			// FIXME: Doesn't re-run property is changed
			it.skip("should track Object.entries()", () => {
				const obj = reactive({ foo: 1, bar: 2 });
				const r = computed(() => Object.entries(obj));
				expect(r.value).to.deep.equal([
					["foo", 2],
					["bar", 2],
				]);

				obj.foo = 42;
				expect(r.value).to.deep.equal([
					["foo", 42],
					["bar", 2],
				]);
			});
		});
	});

	describe("Array", () => {
		it("should have correct prototype", () => {
			const arr = reactive([1, 2]);
			expect(Array.isArray(arr)).to.equal(true);
		});

		it("should track item mutation", () => {
			const arr = reactive([1]);
			const r = computed(() => arr[0]);
			expect(r.value).to.equal(1);

			arr[0] = 2;
			expect(r.value).to.equal(2);
		});

		it("should track .length", () => {
			const arr = reactive([1]);
			const r = computed(() => arr.length);
			expect(r.value).to.equal(1);

			arr.push(2);
			expect(r.value).to.equal(2);
		});

		it("should track destructuring", () => {
			const arr = reactive([1, 2, 3]);
			const r = computed(() => [...arr]);
			expect(r.value).to.deep.equal([1, 2, 3]);

			arr.push(4);
			expect(r.value).to.deep.equal([1, 2, 3, 4]);
		});

		it("should track nested arrays", () => {
			const arr = reactive([1, [2, 3], 4]);
			const r = computed(() => [...arr]);
			expect(r.value).to.deep.equal([1, [2, 3], 4]);

			(arr[1] as number[]).push(99);
			expect(r.value).to.deep.equal([1, [2, 3, 99], 4]);
		});

		it("should track for-loop", () => {
			const arr = reactive([1, 2, 3]);
			const r = computed(() => {
				const out: number[] = [];
				for (let i = 0; i < arr.length; i++) {
					out.push(arr[i]);
				}
				return out;
			});
			expect(r.value).to.deep.equal([1, 2, 3]);

			arr.push(99);
			expect(r.value).to.deep.equal([1, 2, 3, 99]);
		});

		// FIXME: Newly added key is not tracked
		it.skip("should track for-in", () => {
			const arr = reactive([1, 2, 3]);
			const spy = sinon.spy(() => {
				const out: any[] = [];
				for (const k in arr) {
					out.push(k);
				}
				return out;
			});
			const r = computed(spy);
			expect(r.value).to.deep.equal([1, 2, 3]);
			spy.resetHistory();

			arr[0] = 10;
			expect(spy).not.to.be.called;

			arr.push(99);
			expect(r.value).to.deep.equal([1, 2, 3, 4]);
		});

		// FIXME: Newly added key is not tracked
		it.skip("should track for-of", () => {
			const arr = reactive([1, 2, 3]);
			const spy = sinon.spy(() => {
				const out: any[] = [];
				for (const k of arr) {
					out.push(k);
				}
				return out;
			});
			const r = computed(spy);
			expect(r.value).to.deep.equal(["0", "1", "2"]);
			spy.resetHistory();

			arr[0] = 10;
			expect(spy).not.to.be.called;

			arr.push(99);
			expect(r.value).to.deep.equal(["0", "1", "2", "3"]);
		});

		describe("methods", () => {
			it("should track .at()", () => {
				const arr = reactive([1, 2]);
				const a = computed(() => arr.at(0));

				const spy = sinon.spy(() => a.value);
				const res = computed(spy);
				expect(res.value).to.equal(1);
				spy.resetHistory();

				arr[1] = 42;
				expect(res.value).to.equal(1);
				expect(spy).not.to.be.called;

				arr[0] = 10;
				expect(res.value).to.equal(10);
				expect(spy).to.be.calledOnce;
			});

			it("should track .concat()", () => {
				const arr = reactive([1, 2]);
				const arr2 = reactive([3, 4]);
				const r = computed(() => arr.concat(arr2));
				expect(r.value).to.deep.equal([1, 2, 3, 4]);

				arr2[0] = 42;
				expect(r.value).to.deep.equal([1, 2, 42, 4]);

				arr2.push(10);
				expect(r.value).to.deep.equal([1, 2, 42, 4, 10]);
			});

			it("should track .copyWithin()", () => {
				const arr = reactive([1, 2, 3, 4, 5]);
				const r = computed(() => arr);
				expect(r.value).to.deep.equal([1, 2, 3, 4, 5]);

				arr.copyWithin(0, 2, 4);
				expect(r.value).to.deep.equal([3, 4, 3, 4, 5]);
			});

			it("should track .entries()", () => {
				const arr = reactive([1, 2]);
				const r = computed(() => Array.from(arr.entries()));

				expect(r.value).to.deep.equal([
					[0, 1],
					[1, 2],
				]);

				arr.push(3);
				arr[1] = 10;
				expect(r.value).to.deep.equal([
					[0, 1],
					[1, 10],
					[2, 3],
				]);
			});

			it("should track .every()", () => {
				const arr = reactive([1, 2]);
				const r = computed(() => arr.every(x => x > 1));
				expect(r.value).to.equal(false);

				arr[0] = 10;
				expect(r.value).to.equal(true);
			});

			it("should track .fill()", () => {
				const arr = reactive([1, 2, 3, 4]);
				const r = computed(() => arr);
				expect(r.value).to.deep.equal([1, 2, 3, 4]);

				arr.fill(0, 2, 4);
				expect(r.value).to.deep.equal([1, 2, 0, 0]);
			});

			it("should track .filter()", () => {
				const arr = reactive([1, 2, 3]);
				const r = computed(() => arr.filter(x => x > 2));
				expect(r.value).to.deep.equal([3]);

				arr.push(4);
				expect(r.value).to.deep.equal([3, 4]);
			});

			it("should track .filter() on mutation", () => {
				const arr = reactive([1, 2, 3]);
				const r = computed(() => arr.filter(x => x > 2));
				expect(r.value).to.deep.equal([3]);

				arr[0] = 42;
				expect(r.value).to.deep.equal([42, 3]);
			});

			it("should track .find()", () => {
				const arr = reactive([1, 2, 3, 4]);
				const r = computed(() => arr.find(x => x > 1));
				expect(r.value).to.equal(2);

				arr[0] = 10;
				expect(r.value).to.equal(10);
			});

			it("should track .findIndex()", () => {
				const arr = reactive([1, 2, 3, 4]);
				const r = computed(() => arr.findIndex(x => x === 2));
				expect(r.value).to.equal(1);

				arr[0] = 2;
				expect(r.value).to.equal(0);
			});

			it.skip("should track .flat()", () => {
				// TODO
			});

			it.skip("should track .flatMap()", () => {
				// TODO
			});

			it("should track .forEach()", () => {
				const arr = reactive([1, 2]);
				const r = computed(() => {
					const out: number[] = [];
					arr.forEach(x => out.push(x));
					return out;
				});
				expect(r.value).to.deep.equal([1, 2]);

				arr[1] = 0;
				expect(r.value).to.deep.equal([1, 0]);
			});

			it("should track .includes()", () => {
				const arr = reactive([1, 2]);
				const r = computed(() => arr.includes(2));
				expect(r.value).to.equal(true);

				arr[1] = 0;
				expect(r.value).to.equal(false);
			});

			it("should track .indexOf()", () => {
				const arr = reactive([1, 2]);
				const r = computed(() => arr.indexOf(2));
				expect(r.value).to.equal(1);

				arr[0] = 2;
				expect(r.value).to.equal(0);
			});

			it("should track .join()", () => {
				const arr = reactive([1, 2]);
				const r = computed(() => arr.join(","));
				expect(r.value).to.equal("1,2");

				arr.push(3);
				expect(r.value).to.equal("1,2,3");
			});

			it("should track .keys()", () => {
				const arr = reactive([1, 2]);
				const r = computed(() => [...arr.keys()]);
				expect(r.value).to.deep.equal([0, 1]);

				arr.push(3);
				expect(r.value).to.deep.equal([0, 1, 2]);
			});

			it("should track .lastIndexOf()", () => {
				const arr = reactive([1, 2]);
				const r = computed(() => arr.lastIndexOf(1));
				expect(r.value).to.equal(0);

				arr.push(1);
				expect(r.value).to.equal(2);
			});

			it("should track .map()", () => {
				const s = reactive([1, 2, 3]);
				const r = computed(() => s.map(x => "" + x));
				expect(r.value).to.deep.equal(["1", "2", "3"]);
				s[0] = 42;
				expect(r.value).to.deep.equal(["42", "2", "3"]);
			});

			it("should track .pop()", () => {
				const arr = reactive([1, 2]);
				const r = computed(() => arr);
				expect(r.value).to.deep.equal([1, 2]);

				arr.pop();
				expect(r.value).to.deep.equal([1]);
			});

			it("should track .push()", () => {
				const arr = reactive([1, 2]);
				const r = computed(() => arr);
				expect(r.value).to.deep.equal([1, 2]);

				arr.push(3);
				expect(r.value).to.deep.equal([1, 2, 3]);
			});

			it.skip("should track .reduce()", () => {
				// TODO
			});

			it.skip("should track .reduceRight()", () => {
				// TODO
			});

			it.skip("should track .reverse()", () => {
				// TODO
			});

			it("should track .shift()", () => {
				const arr = reactive([1, 2]);
				const r = computed(() => arr);
				expect(r.value).to.deep.equal([1, 2]);

				arr.shift();
				expect(r.value).to.deep.equal([2]);
			});

			it.skip("should track .slice()", () => {
				// TODO
			});

			it.skip("should track .some()", () => {
				// TODO
			});

			it.skip("should track .sort()", () => {
				// TODO
			});

			it("should track .splice()", () => {
				const arr = reactive([1, 2, 3, 4]);
				const r = computed(() => arr[1]);
				expect(r.value).to.equal(2);

				arr.splice(1, 1);
				expect(r.value).to.equal(3);

				arr[1] = 99;
				expect(r.value).to.equal(99);
			});

			it("should track .toLocaleString()", () => {
				expect(reactive([]).toLocaleString()).to.equal([].toLocaleString());
			});

			it("should track .toString()", () => {
				expect(reactive([]).toString()).to.equal([].toString());
			});

			it("should track .unshift()", () => {
				const arr = reactive([1, 2]);
				const r = computed(() => arr);
				expect(r.value).to.deep.equal([1, 2]);

				arr.unshift(10);
				expect(r.value).to.deep.equal([10, 1, 2]);
			});

			it.skip("should track .values()", () => {
				// TODO
			});
		});
	});
});
