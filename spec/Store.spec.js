// Generated by CoffeeScript 1.11.1
(function() {
  var Store, chai, exec, fs, path, should;

  fs = require('fs');

  path = require('path');

  chai = require("chai");

  Store = require("../lib/Store");

  exec = require('child_process').exec;

  should = chai.should();

  describe("The jfs module", function() {
    var NAME;
    NAME = ".specTests";
    afterEach(function(done) {
      return fs.unlink(NAME + '.json', function(err) {
        return exec("rm -rf ./" + NAME, function(err, out) {
          console.log(out);
          if (err != null) {
            console.error(err);
          }
          return done();
        });
      });
    });
    it("is a class", function() {
      return Store.should.be.a["function"];
    });
    it("resolves the path correctly", function() {
      var x;
      x = new Store("./foo/bar", {
        type: 'memory'
      });
      x._dir.should.equal(process.cwd() + '/foo/bar');
      x = new Store(__dirname + "/foo/bar", {
        type: 'memory'
      });
      return x._dir.should.equal(process.cwd() + '/spec/foo/bar');
    });
    describe("save method", function() {
      it("can save an object", function(done) {
        var data, store;
        store = new Store(NAME);
        data = {
          x: 56
        };
        return store.save("id", data, function(err) {
          should.not.exist(err);
          return fs.readFile("./" + NAME + "/id.json", "utf-8", function(err, content) {
            content.should.equal('{"x":56}');
            return store.save("emptyObj", {}, function(err) {
              should.not.exist(err);
              return store.get("emptyObj", function(err, o) {
                should.not.exist(err);
                o.should.eql({});
                return done();
              });
            });
          });
        });
      });
      it("can autosave the id", function(done) {
        var store;
        store = new Store(NAME, {
          saveId: true
        });
        return store.save({}, function(err, id) {
          return store.get(id, function(err, o) {
            o.id.should.equal(id);
            return done();
          });
        });
      });
      it("can autosave the id with a custom key", function(done) {
        var store;
        store = new Store(NAME, {
          saveId: 'myCustomKey'
        });
        return store.save({}, function(err, id) {
          return store.get(id, function(err, o) {
            o.myCustomKey.should.equal(id);
            return done();
          });
        });
      });
      it("can save an object synchronously", function() {
        var content, data, id, store;
        store = new Store(NAME);
        data = {
          s: "ync"
        };
        id = store.saveSync("id", data);
        id.should.equal("id");
        content = fs.readFileSync("./" + NAME + "/id.json", "utf-8");
        return content.should.equal('{"s":"ync"}');
      });
      return it("creates a deep copy for the cache", function(done) {
        var data, store, y, z;
        store = new Store(NAME + '.json');
        z = [];
        y = {
          z: z
        };
        data = {
          x: 56,
          y: y
        };
        return store.save(data, function(err, id) {
          return store.get(id, function(err, res) {
            res.should.eql(data);
            res.should.not.equal(data);
            res.y.should.eql(y);
            res.y.should.not.equal(y);
            res.y.z.should.eql(z);
            res.y.z.should.not.equal(z);
            return done();
          });
        });
      });
    });
    describe("get method", function() {
      it("can load an object", function(done) {
        var data, store;
        store = new Store(NAME);
        data = {
          x: 87
        };
        return store.save(data, function(err, id) {
          return store.get(id, function(err, o) {
            o.x.should.equal(87);
            return done();
          });
        });
      });
      return it("returns an error if it cannot load an object", function(done) {
        var store;
        store = new Store(NAME);
        return store.get("foobarobject", function(err, o) {
          err.should.be.truthy;
          err.message.should.equal("could not load data");
          store = new Store(NAME, {
            type: "memory"
          });
          return store.get("foobarobject", function(err, o) {
            err.message.should.equal("could not load data");
            store = new Store(NAME, {
              type: "single"
            });
            return store.get("foobarobject", function(err, o) {
              err.message.should.equal("could not load data");
              return done();
            });
          });
        });
      });
    });
    describe("getSync method", function() {
      it("can load an object synchronously", function() {
        var data, id, o, store;
        store = new Store(NAME);
        data = {
          x: 87
        };
        id = store.saveSync(data);
        o = store.getSync(id);
        return o.x.should.equal(87);
      });
      return it("returns an error if it cannot load an object", function() {
        var err, store;
        store = new Store(NAME);
        err = store.getSync("foobarobject");
        err.should.be.truthy;
        err.message.should.equal("could not load data");
        store = new Store(NAME, {
          type: "memory"
        });
        err = store.getSync("foobarobject");
        err.message.should.equal("could not load data");
        store = new Store(NAME, {
          type: "single"
        });
        err = store.getSync("foobarobject");
        return err.message.should.equal("could not load data");
      });
    });
    describe("getAll method", function() {
      it("can load all objects", function(done) {
        var store, x1, x2;
        store = new Store(NAME);
        x1 = {
          j: 3
        };
        x2 = {
          k: 4
        };
        return store.save(x1, function(err, id1) {
          return store.save(x2, function(err, id2) {
            return store.all(function(err, all) {
              should.not.exist(err);
              all[id1].j.should.equal(3);
              all[id2].k.should.equal(4);
              return done();
            });
          });
        });
      });
      return it("can load all objects synchronously", function() {
        var all, id1, id2, store, x1, x2;
        store = new Store(NAME);
        x1 = {
          j: 3
        };
        x2 = {
          k: 4
        };
        id1 = store.saveSync(x1);
        id2 = store.save(x2);
        all = store.allSync();
        (all instanceof Error).should.be.falsy;
        all[id1].j.should.equal(3);
        return all[id2].k.should.equal(4);
      });
    });
    describe("delete method", function() {
      it("can delete an object", function(done) {
        var data, store;
        store = new Store(NAME);
        data = {
          y: 88
        };
        return store.save(data, function(err, id) {
          return fs.readFile("./" + NAME + "/" + id + ".json", "utf-8", function(err, content) {
            content.should.not.eql("");
            return store["delete"](id, function(err) {
              return fs.readFile("./" + NAME + "/" + id + ".json", "utf-8", function(err, content) {
                err.should.exist;
                return done();
              });
            });
          });
        });
      });
      return it("returns an error if the record does not exist", function(done) {
        var store;
        store = new Store(NAME);
        return store["delete"]("blabla", function(err) {
          (err instanceof Error).should.be["true"];
          store = new Store(NAME, {
            type: "single"
          });
          return store["delete"]("blabla", function(err) {
            (err instanceof Error).should.be["true"];
            store = new Store(NAME, {
              type: "memory"
            });
            return store["delete"]("blabla", function(err) {
              (err instanceof Error).should.be["true"];
              return done();
            });
          });
        });
      });
    });
    describe("deleteSync method", function() {
      it("can delete an object synchonously", function() {
        var content, data, err, id, store;
        store = new Store(NAME);
        data = {
          y: 88
        };
        id = store.saveSync(data);
        content = fs.readFileSync("./" + NAME + "/" + id + ".json", "utf-8");
        content.should.not.eql("");
        err = store.deleteSync(id);
        should.not.exist(err);
        return (function() {
          return fs.readFileSync("./" + NAME + "/" + id + ".json", "utf-8");
        }).should["throw"]();
      });
      return it("returns an error if the record does not exist", function() {
        var err, store;
        store = new Store(NAME);
        err = store.deleteSync("blabla");
        (err instanceof Error).should.be["true"];
        store = new Store(NAME, {
          type: "single"
        });
        err = store.deleteSync("blabla");
        (err instanceof Error).should.be["true"];
        store = new Store(NAME, {
          type: "memory"
        });
        err = store.deleteSync("12345");
        return (err instanceof Error).should.be["true"];
      });
    });
    it("can pretty print the file content", function() {
      var content, id, store;
      store = new Store(NAME, {
        pretty: true
      });
      id = store.saveSync("id", {
        p: "retty"
      });
      content = fs.readFileSync("./" + NAME + "/id.json", "utf-8");
      return content.should.equal("{\n  \"p\": \"retty\"\n}");
    });
    describe("'single' mode", function() {
      it("stores data in a single file", function(done) {
        var store;
        store = new Store(NAME, {
          type: 'single',
          pretty: true
        });
        return fs.readFile("./" + NAME + ".json", "utf-8", function(err, content) {
          var d1, d2;
          content.should.equal("{}");
          d1 = {
            x: 0.6
          };
          d2 = {
            z: -3
          };
          return store.save("d1", d1, function(err) {
            should.not.exist(err);
            return store.save("d2", d2, function(err) {
              var f;
              should.not.exist(err);
              f = path.join(process.cwd(), NAME + ".json");
              return fs.readFile(f, "utf-8", function(err, content) {
                should.not.exist(err);
                content.should.equal("{\n  \"d1\": {\n    \"x\": 0.6\n  },\n  \"d2\": {\n    \"z\": -3\n  }\n}");
                return done();
              });
            });
          });
        });
      });

      /*
      fs.rename 'overrides' an existing file
      even if its write protected
       */
      it("it checks for write protection", function(done) {
        var f, store;
        f = path.resolve(NAME + "/mydb.json");
        store = new Store(f, {
          type: 'single'
        });
        store.saveSync('id', {
          some: 'data'
        });
        fs.chmodSync(f, '0444');
        return store.save('foo', {
          bar: 'baz'
        }, function(err, id) {
          should.exist(err);
          fs.chmodSync(f, '0644');
          return done();
        });
      });
      it("loads an existing db", function(done) {
        var store;
        store = new Store(NAME, {
          single: true
        });
        return store.save("id1", {
          foo: "bar"
        }, function(err) {
          store = new Store(NAME, {
            single: true
          });
          return fs.readFile("./" + NAME + ".json", "utf-8", function(err, content) {
            content.should.equal('{"id1":{"foo":"bar"}}');
            return store.all(function(err, items) {
              should.not.exist(err);
              items.id1.should.eql({
                foo: "bar"
              });
              return done();
            });
          });
        });
      });
      it("get data from a single file", function(done) {
        var data, store;
        store = new Store(NAME, {
          single: true
        });
        data = {
          foo: "asdlöfj"
        };
        return store.save(data, function(err, id) {
          return store.get(id, function(err, o) {
            o.foo.should.equal("asdlöfj");
            return done();
          });
        });
      });
      it("can delete an object", function(done) {
        var data, f, store;
        store = new Store(NAME, {
          single: true
        });
        data = {
          y: 88
        };
        f = path.join(process.cwd(), NAME + ".json");
        return store.save(data, function(err, id) {
          return fs.readFile(f, "utf-8", function(err, content) {
            (content.length > 7).should.be.truthy;
            return store["delete"](id, function(err) {
              return fs.readFile(f, "utf-8", function(err, content) {
                should.not.exist(err);
                content.should.equal("{}");
                return done();
              });
            });
          });
        });
      });
      return it("can be defined if the name is a file", function(done) {
        var f, store;
        store = new Store('./' + NAME + '/foo.json');
        store._single.should.be["true"];
        f = path.join(process.cwd(), "./" + NAME + "/foo.json");
        return fs.readFile(f, "utf-8", function(err, content) {
          should.not.exist(err);
          content.should.equal("{}");
          return done();
        });
      });
    });
    return describe("'memory' mode", function() {
      return it("does not write the data to a file", function(done) {
        var data, store;
        store = new Store(NAME, {
          type: 'memory'
        });
        data = {
          y: 78
        };
        return store.save("id", data, function(err, id) {
          should.not.exist(err);
          return fs.readFile("./" + NAME + "/id.json", "utf-8", function(err, content) {
            should.exist(err);
            should.not.exist(content);
            store.allSync().should.eql({
              id: {
                y: 78
              }
            });
            store.saveSync('foo', {
              bar: 'baz'
            });
            return store.all(function(err, d) {
              should.not.exist(err);
              d.should.eql({
                foo: {
                  bar: 'baz'
                },
                id: {
                  y: 78
                }
              });
              store.deleteSync('id');
              store.allSync().should.eql({
                foo: {
                  bar: 'baz'
                }
              });
              should["throw"](function() {
                return fs.readFileSync("./" + NAME + "/id.json", "utf-8");
              });
              return done();
            });
          });
        });
      });
    });
  });

}).call(this);
