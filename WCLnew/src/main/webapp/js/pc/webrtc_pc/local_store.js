// Generated by CoffeeScript 1.4.0
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function(window) {
    var IndexedDbLocalStore, LocalStore, NoSerializer, QUOTA_SIZE, get_store, indexedDB, isFunction, store_info;
    store_info = {};

    var IDBCursor = window.IDBCursor || window.webkitIDBCursor;// 表示游标方向的数值常量

    var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;//不同浏览器中键范围的差异

    var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;//IE10、Firefox\Chrome

    indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;//Firefox 4\Chrome\IE10
    isFunction = function(obj) {
      return typeof obj === 'function';
    };
    QUOTA_SIZE = 1024 * 1024 * 1024 * 10;
    NoSerializer = (function() {

      function NoSerializer() {}

      NoSerializer.prototype.serialize = function(str) {
        return str;
      };

      NoSerializer.prototype.deserialize = function(data) {
        return data;
      };

      return NoSerializer;

    })();
    LocalStore = (function() {

      function LocalStore(config) {
        if (config == null) {
          config = {};
        }
        store_info.initialized = false;
        this.context ='webrtc';
        store_info.operation_queue = [];
        switch (config.serializer) {
          case 'none':
            this.serializer = new NoSerializer();
            break;
          default:
            this.serializer = new NoSerializer();
        }
      }

      LocalStore.prototype.enable = null;

      LocalStore.prototype.store = null;

      LocalStore.prototype.load = null;

      LocalStore.prototype.has = null;

      LocalStore.prototype.remove = null;

      return LocalStore;

    })();
   
    DatabaseLocalStore = (function(_super) {

      __extends(DatabaseLocalStore, _super);

      function DatabaseLocalStore(config) {
        DatabaseLocalStore.__super__.constructor.call(this, config);
      }

      DatabaseLocalStore.prototype.init = function(cb) {
        var db,
          _this = this;
        db = this.db = openDatabase(this.context, '1.0', 'Chromatik DB', 1024 * 1024 * 1024);
        return db.transaction(function(tx) {
          tx.executeSql("CREATE TABLE IF NOT EXISTS \"" + _this.context + "\" (key,value BLOB)");
          if (isFunction(cb)) {
            return cb();
          }
        });
      };

      DatabaseLocalStore.prototype.enable = function(cb) {
        return this.init(cb);
      };

      DatabaseLocalStore.prototype.store = function(key, obj, cb) {
        var _this = this;
        return this.init(function() {
          return _this.remove(key, function() {
            return _this.db.transaction(function(tx) {
              var sql;
              sql = "INSERT INTO \"" + _this.context + "\" (key,value) VALUES (\"" + key + "\",\"" + obj + "\")";
              tx.executeSql(sql);
              if (isFunction(cb)) {
                return cb();
              }
            });
          });
        });
      };

      DatabaseLocalStore.prototype.load = function(key, cb) {
        var _this = this;
        return this.init(function() {
          return _this.db.transaction(function(tx) {
            var sql;
            sql = "SELECT * FROM \"" + _this.context + "\" WHERE key=\"" + key + "\"";
            return tx.executeSql(sql, [], function(tx, results) {
              if (results.rows.length === 0) {
                return cb(null);
              } else {
                return cb(results.rows.item(0).value);
              }
            });
          });
        });
      };

      DatabaseLocalStore.prototype.remove = function(key, cb) {
        var _this = this;
        return this.init(function() {
          return _this.db.transaction(function(tx) {
            return tx.executeSql("DELETE FROM \"" + _this.context + "\" WHERE key=\"" + key + "\"", [], function() {
              if (isFunction(cb)) {
                return cb();
              }
            });
          });
        });
      };

      DatabaseLocalStore.prototype.has = function(key, cb) {
        var self;
        self = this;
        return this.load(key, function(results) {
          return cb(results != null);
        });
      };

      return DatabaseLocalStore;

    })(LocalStore);
    IndexedDbLocalStore = (function(_super) {

      __extends(IndexedDbLocalStore, _super);

      function IndexedDbLocalStore(config) {
        IndexedDbLocalStore.__super__.constructor.call(this, config);
        this.init();
      }

      IndexedDbLocalStore.prototype.init = function(init_cb) {
        var error_cb, request, self, success_cb,
          _this = this;
        request = indexedDB.open(this.context, 1);
        if (this.db) {
          init_cb();
        }
        self = this;
        error_cb = function() {
          return console.log('error', arguments);
        };
        success_cb = function(event) {
          var db;
          self.initialized = store_info.initialized = true;
          db = self.db = request.result;
          if (isFunction(init_cb)) {
            //init_cb();
          }
          return ;//self.execute_pending();
        };
        request.onupgradeneeded = function(event) {
          var db, objectStore;
          self.db = db = event.target.result;

          objectStore=db.createObjectStore('webrtc',{keyPath: 'id'});
                    objectStore.createIndex('from','from',{unique:false}); 
                    objectStore.createIndex('to','to',{unique:false}); 
                    objectStore.createIndex('type','type',{unique:false});
                    objectStore.createIndex('data','data',{unique:false}); 
                    
          return objectStore;
        };
        return request.onsuccess = success_cb;
      };

      IndexedDbLocalStore.prototype.enable = function(cb) {
        if (isFunction(cb)) {
          return cb();
        }
      };

      //存储
      IndexedDbLocalStore.prototype.store = function(obj, cb) {
        var _this = this;
        return this.init(function() {
          var objectStore, request, transaction;
          transaction = _this.db.transaction(_this.context, "readwrite");
          objectStore = transaction.objectStore(_this.context);//得到表里的objectStore对象
          request = objectStore.put(obj);
          return request.onsuccess = function(event) {
            return cb(event.target.result);
          };
        });
      };

      //通过Id取单值
      IndexedDbLocalStore.prototype.loadById = function(key, cb) {
        var _this = this;
        return this.init(function() {
          var objectStore, request, transaction,_index;
          transaction = _this.db.transaction(_this.context);
          objectStore = transaction.objectStore(_this.context);
          request = objectStore.get(key);
          return request.onsuccess = function(event) {
            if (isFunction(cb)) {
              return cb(request.result);
            }
          };
        });
      };

      //通过索引取单值
      IndexedDbLocalStore.prototype.loadByIndex = function(index,value, cb) {
        var _this = this;
        return this.init(function() {
          var objectStore, request, transaction,_index;
          transaction = _this.db.transaction(_this.context);
          objectStore = transaction.objectStore(_this.context);
          _index = objectStore.index(index);
          request = _index.get(value);
          return request.onsuccess = function(event) {
            if (isFunction(cb)) {
              return cb(request.result);
            }
          };
        });
      };

      //通过索引取多值
      IndexedDbLocalStore.prototype.loadMulDataByIndex = function(index,value, cb) {
        var _this = this;
        return this.init(function() {
          var objectStore, request, transaction,_index;
          transaction = _this.db.transaction(_this.context);
          objectStore = transaction.objectStore(_this.context);
          _index = objectStore.index(index);
          request = _index.openCursor(IDBKeyRange.only(value));//openCursor () 创建游标索引多个值
          request.onsuccess = function(event) {
             var cursor=event.target.result;//取得存储空间中的下一个对象
              if (cursor && isFunction(cb)) {
                cb(cursor.value);
                cursor.continue(); //移动到结果集对象的下一项
            }
            else{
            	
            	addPerHistoryChat(chatpageindex);
            }
          }
        });
      };

      //删除
      IndexedDbLocalStore.prototype.remove = function(key, cb) {
        var _this = this;
        return this.init(function() {
          var objectStore, request, transaction;
          transaction = _this.db.transaction(_this.context, 'readwrite');
          objectStore = transaction.objectStore(_this.context);
          request = objectStore["delete"](key);
          return request.onsuccess = cb;
        });
      };

      //判断Id 值
      IndexedDbLocalStore.prototype.has = function(key, cb) {
        var _this = this;
        return this.init(function() {
          return _this.loadById(key, function(obj) {
            return cb(obj != null);
          });
        });
      };

      return IndexedDbLocalStore;

    })(LocalStore);
    get_store = function() {
      if (indexedDB) {
        return IndexedDbLocalStore;
      } else {
        return null;
      }
    };

    window.IndexedDbLocalStore = IndexedDbLocalStore;
    return window.get_store = get_store;
  })(window);

}).call(this);
