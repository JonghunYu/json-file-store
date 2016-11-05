/*
Copyright (C) 2012 - 2016 Markus Kohlhase <mail@markus-kohlhase.de>
 */

"use strict";

var async   = require('async');
var fs      = require('fs');
var path    = require('path');
var uuid    = require('node-uuid');
var mkdirp  = require('mkdirp');
var clone   = require('clone');

var isJSONFile = function(f) {
  return f.substr(-5) === ".json";
};

var removeFileExtension = function(f) {
  return f.split(".json")[0];
};

var getIDs = function(a) {
  return a.filter(isJSONFile).map(removeFileExtension);
};

var readIDsSync = function(d) {
  return getIDs(fs.readdirSync(d));
};

var readIDs = function(d, cb) {
  return fs.readdir(d, function(err, ids) {
    return cb(err, getIDs(ids));
  });
};

var canWrite = function(stat) {
  var group, owner;
  owner = (typeof process.getuid === "function" ? process.getuid() : void 0) === stat.uid;
  group = (typeof process.getgid === "function" ? process.getgid() : void 0) === stat.gid;
  return owner && (stat.mode & 128) || group && (stat.mode & 16) || (stat.mode & 2);
};

var canWriteToFile = function(file, cb) {
  return fs.exists(file, function(e) {
    if (!e) {
      return cb(null);
    }
    return fs.stat(file, function(err, s) {
      if (err) {
        return cb(err);
      }
      if (canWrite(s)) {
        return cb(null);
      } else {
        return cb(new Error("File is protected"));
      }
    });
  });
};

var canWriteToFileSync = function(file) {
  if (!fs.existsSync(file)) {
    return;
  }
  if (canWrite(fs.statSync(file))) {

  } else {
    throw new Error("File is protected");
  }
};

var getObjectFromFileSync = function(id) {
  var e;
  try {
    return JSON.parse(fs.readFileSync(this._getFileName(id), "utf8"));
  } catch (error) {
    e = error;
    return e;
  }
};

var getObjectFromFile = function(id, cb) {
  return fs.readFile(this._getFileName(id), "utf8", function(err, o) {
    var e;
    if (err) {
      return cb(err);
    }
    try {
      return cb(null, JSON.parse(o));
    } catch (error) {
      e = error;
      return cb(e);
    }
  });
};

var saveObjectToFile = function(o, file, cb) {
  var e, indent, json, tmpFileName;
  indent = this._pretty ? 2 : void 0;
  try {
    json = JSON.stringify(o, null, indent);
  } catch (error) {
    e = error;
    if (cb != null) {
      return cb(e);
    } else {
      return e;
    }
  }
  tmpFileName = file + uuid.v4() + ".tmp";
  if (cb != null) {
    return canWriteToFile(file, function(err) {
      if (err) {
        return cb(err);
      }
      return fs.writeFile(tmpFileName, json, 'utf8', function(err) {
        if (err) {
          return cb(err);
        }
        return fs.rename(tmpFileName, file, cb);
      });
    });
  } else {
    try {
      canWriteToFileSync(file);
      fs.writeFileSync(tmpFileName, json, 'utf8');
      return fs.renameSync(tmpFileName, file);
    } catch (error) {
      e = error;
      return e;
    }
  }
};

var id2fileName = function(id, dir) {
  return path.join(dir, id + ".json");
};

var save = function(id, o, cb) {
  var backup, data, done, file, k;
  if (typeof id === "object") {
    cb = o;
    o = id;
    id = null;
  }
  if (id == null) {
    id = uuid.v4();
  }
  file = this._getFileName(id);
  o = clone(o);
  if (this._saveId) {
    if ((typeof (k = this._saveId)) === 'string' && k.length > 0) {
      o[k] = id;
    } else {
      o.id = id;
    }
  }
  data = this._single ? (backup = this._cache[id], this._cache[id] = o, this._cache) : o;
  done = (function(_this) {
    return function(err) {
      if (err) {
        if (_this._single) {
          _this._cache[id] = backup;
        }
        if (cb != null) {
          return cb(err);
        } else {
          return err;
        }
      } else {
        _this._cache[id] = o;
        if (cb != null) {
          return cb(null, id);
        } else {
          return id;
        }
      }
    };
  })(this);
  if (this._memory) {
    return done();
  } else {
    if (cb != null) {
      return saveObjectToFile.call(this, data, file, done);
    } else {
      return done(saveObjectToFile.call(this, data, file));
    }
  }
};

var get = function(id, cb) {
  var done, err, o;
  o = clone(this._cache[id]);
  if (o != null) {
    return (cb != null ? cb(null, o) : o);
  }
  done = (function(_this) {
    return function(err, o) {
      var e, item;
      if (err) {
        e = new Error("could not load data");
        if (cb != null) {
          return cb(e);
        } else {
          return e;
        }
      }
      item = _this._single ? o[id] : o;
      if (item == null) {
        e = new Error("could not load data");
        if (cb != null) {
          return cb(e);
        } else {
          return e;
        }
      }
      _this._cache[id] = item;
      if (cb != null) {
        return cb(null, item);
      } else {
        return item;
      }
    };
  })(this);
  if (this._memory) {
    return done(null, o);
  }
  if (cb != null) {
    return getObjectFromFile.call(this, id, done);
  }
  err = (o = getObjectFromFileSync.call(this, id)) instanceof Error;
  return done((err ? o : void 0), (!err ? o : void 0));
};

var remove = function(id, cb) {
  var cacheBackup, done, e, err, file, notInCache, o;
  file = this._getFileName(id);
  cacheBackup = this._cache[id];
  if (cacheBackup == null) {
    notInCache = new Error(id + " does not exist");
  }
  done = (function(_this) {
    return function(err) {
      if (err) {
        _this._cache[id] = cacheBackup;
        return (cb != null ? cb(err) : err);
      }
      delete _this._cache[id];
      return typeof cb === "function" ? cb() : void 0;
    };
  })(this);
  if (this._single) {
    delete this._cache[id];
    if (this._memory || (notInCache != null)) {
      return done(notInCache);
    }
    if (cb != null) {
      return saveObjectToFile.call(this, this._cache, file, done);
    }
    err = (o = saveObjectToFile.call(this, this._cache, file)) instanceof Error;
    return done((err ? o : void 0), (!err ? o : void 0));
  } else {
    if (this._memory) {
      return done(notInCache);
    }
    if (cb != null) {
      return fs.unlink(file, done);
    }
    try {
      return done(fs.unlinkSync(file));
    } catch (error) {
      e = error;
      return done(e);
    }
  }
};

var Store = (function() {
  function Store(name, opt) {
    var fn;
    this.name = name != null ? name : 'store';
    if (opt == null) {
      opt = {};
    }
    this._single = opt.single === true || opt.type === 'single';
    this._pretty = opt.pretty === true;
    this._memory = opt.memory === true || opt.type === 'memory';
    this._saveId = opt.saveId;
    if (isJSONFile(this.name)) {
      this.name = this.name.split(".json")[0];
      this._single = true;
    }
    this._dir = path.resolve(this.name);
    if (this._single) {
      this._dir = path.dirname(this._dir);
    }
    this._cache = {};
    if (!this._memory) {
      mkdirp.sync(this._dir);
    }
    if (this._single) {
      fn = this._getFileName();
      if (!this._memory) {
        if (!fs.existsSync(fn)) {
          if (fs.writeFileSync(fn, "{}", 'utf8')) {
            throw new Error("could not create database");
          }
        }
      }
      this._cache = this.allSync();
    }
  }

  Store.prototype._getFileName = function(id) {
    if (this._single) {
      return path.join(this._dir, (path.basename(this.name)) + ".json");
    } else {
      return id2fileName(id, this._dir);
    }
  };

  Store.prototype.save = function(id, o, cb) {
    if (cb == null) {
      cb = function() {};
    }
    return save.call(this, id, o, cb);
  };

  Store.prototype.saveSync = function(id, o) {
    return save.call(this, id, o);
  };

  Store.prototype.get = function(id, cb) {
    if (cb == null) {
      cb = function() {};
    }
    return get.call(this, id, cb);
  };

  Store.prototype.getSync = function(id) {
    return get.call(this, id);
  };

  Store.prototype["delete"] = function(id, cb) {
    return remove.call(this, id, cb);
  };

  Store.prototype.deleteSync = function(id) {
    return remove.call(this, id);
  };

  Store.prototype.all = function(cb) {
    if (cb == null) {
      cb = function() {};
    }
    if (this._memory) {
      return cb(null, this._cache);
    } else if (this._single) {
      return getObjectFromFile.call(this, void 0, cb);
    } else {
      return readIDs(this._dir, (function(_this) {
        return function(err, ids) {
          var all, id, loaders, that;
          if (typeof er !== "undefined" && er !== null) {
            return cb(err);
          }
          that = _this;
          all = {};
          loaders = (function() {
            var i, len, results;
            results = [];
            for (i = 0, len = ids.length; i < len; i++) {
              id = ids[i];
              results.push((function(id) {
                return function(cb) {
                  return that.get(id, function(err, o) {
                    if (!err) {
                      all[id] = o;
                    }
                    return cb(err);
                  });
                };
              })(id));
            }
            return results;
          })();
          return async.parallel(loaders, function(err) {
            return cb(err, all);
          });
        };
      })(this));
    }
  };

  Store.prototype.allSync = function() {
    var db, f, i, item, len, objects, ref;
    if (this._memory) {
      return this._cache;
    }
    if (this._single) {
      db = getObjectFromFileSync.apply(this);
      if (typeof db !== "object") {
        throw new Error("could not load database");
      }
      return db;
    } else {
      objects = {};
      ref = readIDsSync(this._dir);
      for (i = 0, len = ref.length; i < len; i++) {
        f = ref[i];
        item = getObjectFromFileSync.call(this, f);
        if (item != null) {
          objects[f] = item;
        } else {
          console.error("could not load '" + f + "'");
        }
      }
      return objects;
    }
  };

  return Store;

})();

module.exports = Store;
