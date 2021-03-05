'use strict';

var _slicedToArray = require('@babel/runtime/helpers/slicedToArray');
var _objectWithoutProperties = require('@babel/runtime/helpers/objectWithoutProperties');
var _regeneratorRuntime = require('@babel/runtime/regenerator');
var _asyncToGenerator = require('@babel/runtime/helpers/asyncToGenerator');
var _defineProperty = require('@babel/runtime/helpers/defineProperty');
var _ = require('lodash');
var deepObjectDiff = require('deep-object-diff');
var elasticsearch = require('@elastic/elasticsearch');
var uuid = require('uuid');
var crypto = require('crypto');
var _toConsumableArray = require('@babel/runtime/helpers/toConsumableArray');
var _typeof = require('@babel/runtime/helpers/typeof');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _slicedToArray__default = /*#__PURE__*/_interopDefaultLegacy(_slicedToArray);
var _objectWithoutProperties__default = /*#__PURE__*/_interopDefaultLegacy(_objectWithoutProperties);
var _regeneratorRuntime__default = /*#__PURE__*/_interopDefaultLegacy(_regeneratorRuntime);
var _asyncToGenerator__default = /*#__PURE__*/_interopDefaultLegacy(_asyncToGenerator);
var _defineProperty__default = /*#__PURE__*/_interopDefaultLegacy(_defineProperty);
var ___default = /*#__PURE__*/_interopDefaultLegacy(_);
var crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);
var _toConsumableArray__default = /*#__PURE__*/_interopDefaultLegacy(_toConsumableArray);
var _typeof__default = /*#__PURE__*/_interopDefaultLegacy(_typeof);

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var esClient;

function createESClient(input) {
  var _input$endpoint$split;

  return new elasticsearch.Client(_objectSpread({
    nodes: (_input$endpoint$split = input === null || input === void 0 ? void 0 : input.endpoint.split(",")) !== null && _input$endpoint$split !== void 0 ? _input$endpoint$split : "http://localhost:9200"
  }, input));
}

function getESClient(input) {
  if (!esClient) {
    console.log("[Audit Trail] Create new connection to Elasticsearch");
    esClient = createESClient(input);
  }

  return esClient;
}
function elasticsearchInsert(_x) {
  return _elasticsearchInsert.apply(this, arguments);
}

function _elasticsearchInsert() {
  _elasticsearchInsert = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(_ref) {
    var _ref$indexName, indexName, insertdata, client, result;

    return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _ref$indexName = _ref.indexName, indexName = _ref$indexName === void 0 ? 'audit-trail' : _ref$indexName, insertdata = _ref.insertdata, client = _ref.client;
            _context.prev = 1;
            _context.next = 4;
            return client.index({
              index: indexName,
              op_type: "create",
              refresh: "false",
              body: insertdata
            });

          case 4:
            result = _context.sent;
            return _context.abrupt("return", result.body);

          case 8:
            _context.prev = 8;
            _context.t0 = _context["catch"](1);
            console.log("[Audit Trail] elasticsearch insert error", _context.t0);
            return _context.abrupt("return", null);

          case 12:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[1, 8]]);
  }));
  return _elasticsearchInsert.apply(this, arguments);
}

function elasticsearchSearch(_x2) {
  return _elasticsearchSearch.apply(this, arguments);
}

function _elasticsearchSearch() {
  _elasticsearchSearch = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee2(_ref2) {
    var _ref2$indexName, indexName, commitHashArray, _ref2$size, size, _ref2$sort, sort, client, result;

    return _regeneratorRuntime__default['default'].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _ref2$indexName = _ref2.indexName, indexName = _ref2$indexName === void 0 ? 'audit-trail' : _ref2$indexName, commitHashArray = _ref2.commitHashArray, _ref2$size = _ref2.size, size = _ref2$size === void 0 ? 1 : _ref2$size, _ref2$sort = _ref2.sort, sort = _ref2$sort === void 0 ? {
              time: "desc"
            } : _ref2$sort, client = _ref2.client;
            _context2.prev = 1;
            _context2.next = 4;
            return client.search({
              index: indexName,
              size: size,
              sort: sort,
              body: {
                query: {
                  match: {
                    commitHash: {
                      query: commitHashArray.join(" ")
                    }
                  }
                }
              }
            });

          case 4:
            result = _context2.sent;
            return _context2.abrupt("return", result);

          case 8:
            _context2.prev = 8;
            _context2.t0 = _context2["catch"](1);
            console.log("[Audit Trail] elasticsearch search error", _context2.t0);
            return _context2.abrupt("return", null);

          case 12:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, null, [[1, 8]]);
  }));
  return _elasticsearchSearch.apply(this, arguments);
}

function diffParser(diff, type) {
  var change = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var path = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];

  if (diff !== null && _typeof__default['default'](diff) === "object") {
    var keys = Object.keys(diff);

    for (var _i = 0, _keys = keys; _i < _keys.length; _i++) {
      var key = _keys[_i];

      if (key.toLowerCase() === type.toLowerCase()) {
        diff = diff[key];
        change[path.join(".")] = diff;
        break;
      } else {
        diff[key] = diffParser(diff[key], type, change, [].concat(_toConsumableArray__default['default'](path), [key])).diff;
      }
    }
  } else {
    diff = diff[type];
  }

  return {
    diff: diff,
    change: change
  };
}
function yamlLikeStringify(_ref) {
  var input = _ref.input,
      _ref$index = _ref.index,
      index = _ref$index === void 0 ? 0 : _ref$index;
  var result = "";

  for (var i = 0; (_ref2 = i < ((_Object$keys = Object.keys(input)) === null || _Object$keys === void 0 ? void 0 : _Object$keys.length)) !== null && _ref2 !== void 0 ? _ref2 : 0; i++) {
    var _ref2, _Object$keys, _Object$keys2;

    var key = (_Object$keys2 = Object.keys(input)) === null || _Object$keys2 === void 0 ? void 0 : _Object$keys2[i];

    if (___default['default'].isArrayLikeObject(input[key])) {
      var tmp = [];
      tmp.push(yamlLikeStringify({
        input: input[key],
        index: index + 1
      }));
      result = "".concat(result, "^").concat(index, "_").concat(encodeURIComponent(key), ":[").concat(tmp.join(","), "]$");
    } else if (___default['default'].isObjectLike(input[key])) {
      result = "".concat(result, "^").concat(index, "_").concat(encodeURIComponent(key), ":{").concat(yamlLikeStringify({
        input: input[key],
        index: index + 1
      }), "}$");
      console.log(input[key]);
    } else {
      result = "".concat(result, "^").concat(index, "_").concat(encodeURIComponent(key), ":").concat(encodeURIComponent(input[key]), "$");
    }
  }

  return result;
}
function yamlLikeStringParser(_ref3) {
  var _ref3$input = _ref3.input,
      input = _ref3$input === void 0 ? "{}" : _ref3$input,
      _ref3$index = _ref3.index,
      index = _ref3$index === void 0 ? 0 : _ref3$index;
  var result = {};
  var regex = new RegExp("".concat(index, "_(.*?):(.*)"));
  var searchTerm = "^".concat(index, "_");
  var indexOfArray = [];
  var _index = 0;

  while (input.indexOf(searchTerm, _index) > -1) {
    indexOfArray.push(input.indexOf(searchTerm, _index));
    _index = input.indexOf(searchTerm, _index) + 1;
  }

  for (var i = 0; i < indexOfArray.length; i++) {
    var substringEnd = indexOfArray[i + 1] || input.length - 1;

    var _substring = input.substring(indexOfArray[i] + 1, substringEnd - 1);

    var found = _substring.match(regex);

    if (found && found.length > 0) {
      if (found[2][found[2].length - 1] === "]") {
        result[found[1]] = Object.values(yamlLikeStringParser({
          input: found[2],
          index: index + 1
        }));
      } else if (found[2][found[2].length - 1] === "}") {
        result[found[1]] = yamlLikeStringParser({
          input: found[2],
          index: index + 1
        });
      } else {
        result[found[1]] = decodeURIComponent(found[2]);
      }
    }
  }

  return result;
}

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$1(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$1(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var auditTrail = function auditTrail(options) {
  // audit trail database info
  this.auditTrailDBType = (options === null || options === void 0 ? void 0 : options.DBType) || "elasticsearch";
  this.auditTrailHost = (options === null || options === void 0 ? void 0 : options.host) || "http://localhost:9200";
  this.indexName = (options === null || options === void 0 ? void 0 : options.indexName) || "audit-trail";
  this.ESinfo = options === null || options === void 0 ? void 0 : options.ESinfo; // custom database

  this.customClient = options === null || options === void 0 ? void 0 : options.customClient;
  this.customAddData = options === null || options === void 0 ? void 0 : options.customAddData;
  this.customQueryFunction = options === null || options === void 0 ? void 0 : options.customQueryFunction; // target database (non audit trail database) manipulation (for revert)

  this.databaseAddOneRowFunction = options === null || options === void 0 ? void 0 : options.databaseAddOneRowFunction;
  this.databaseUpdateOneRowFunction = options === null || options === void 0 ? void 0 : options.databaseUpdateOneRowFunction;
  this.databaseDeleteOneRowFunction = options === null || options === void 0 ? void 0 : options.databaseDeleteOneRowFunction;
  this.databaseCustomFunction = options === null || options === void 0 ? void 0 : options.databaseCustomActionFunction;

  if (this.auditTrailDBType === "elasticsearch") {
    this.client = getESClient(_objectSpread$1({
      endpoint: this.auditTrailHost
    }, this.ESinfo));
  } else if (this.auditTrailDBType === "CUSTOM") {
    console.log("[Audit Trail] Custom DB Client");
  }
};

function getRightmostIndexBeforeEnd(_ref) {
  var _ref$input = _ref.input,
      input = _ref$input === void 0 ? "" : _ref$input,
      _ref$searchText = _ref.searchText,
      searchText = _ref$searchText === void 0 ? "" : _ref$searchText,
      _ref$index = _ref.index,
      index = _ref$index === void 0 ? 0 : _ref$index,
      end = _ref.end;
  var i = 0;

  while (i = input.indexOf(searchText, index)) {
    if (i >= end || i === -1) {
      break;
    }

    index = i + 1;
  }

  return index - 1;
}

function createTreeDiagram(_ref2) {
  var commitHashMap = _ref2.commitHashMap,
      _ref2$index = _ref2.index,
      index = _ref2$index === void 0 ? 0 : _ref2$index,
      _ref2$level = _ref2.level,
      level = _ref2$level === void 0 ? 0 : _ref2$level,
      _ref2$size = _ref2.size,
      size = _ref2$size === void 0 ? 10 : _ref2$size,
      _ref2$path = _ref2.path,
      path = _ref2$path === void 0 ? "" : _ref2$path,
      _ref2$onlyCurrentBran = _ref2.onlyCurrentBranch,
      onlyCurrentBranch = _ref2$onlyCurrentBran === void 0 ? false : _ref2$onlyCurrentBran,
      _ref2$before = _ref2.before,
      before = _ref2$before === void 0 ? 5 : _ref2$before,
      currentCommit = _ref2.currentCommit;

  if (size <= 0) {
    var _result2 = {};

    ___default['default'].set(_result2, path, {});

    return _result2;
  }

  var currentIndex = index;
  index = commitHashMap.indexOf("^".concat(level, "_"), index);

  if (new RegExp('\\^[0-9]{1,}_').test(commitHashMap.substring(currentIndex + 2, index - 1))) {
    // currentIndex + 2 for handling getRightmostIndexBeforeEnd case
    var _result3 = {};

    ___default['default'].set(_result3, path, {});

    return _result3;
  }

  if (index === -1) {
    return createTreeDiagram({
      commitHashMap: commitHashMap,
      index: index,
      level: level + 1,
      size: 0,
      path: path,
      onlyCurrentBranch: onlyCurrentBranch,
      before: before - 1
    });
  }

  var result = {};
  var commitHash = commitHashMap.substring(index + 1 + level.toString().length + 1, index + 1 + level.toString().length + 1 + 40);

  if (path) {
    path = "".concat(path, ".").concat(commitHash);
  } else {
    path = "".concat(commitHash);
  }

  if (onlyCurrentBranch && before > 0) {
    var targetIndex = commitHashMap.indexOf("_".concat(currentCommit));
    var closestIndex = getRightmostIndexBeforeEnd({
      input: commitHashMap.substring(0, targetIndex),
      searchText: "^".concat(level + 1, "_"),
      index: index,
      end: targetIndex
    });
    return createTreeDiagram({
      commitHashMap: commitHashMap,
      index: closestIndex,
      level: level + 1,
      size: size - 1,
      path: path,
      onlyCurrentBranch: onlyCurrentBranch,
      before: before - 1,
      currentCommit: currentCommit
    });
  }

  var nextTwoIndex = commitHashMap.indexOf("^".concat(level + 2, "_"), index);

  if (nextTwoIndex === -1) {
    nextTwoIndex = commitHashMap.length;
  }

  var nextSameLevelIndex = commitHashMap.indexOf("^".concat(level, "_"), index + 1);
  var _indexArray = [];

  var _index = commitHashMap.indexOf("^".concat(level + 1, "_"), index);

  while (_index !== -1 && _index < (nextSameLevelIndex != -1 ? nextSameLevelIndex : commitHashMap.length)) {
    _indexArray.push(_index);

    _index = commitHashMap.indexOf("^".concat(level + 1, "_"), _index + 1);
  }

  if (_indexArray.length > 1) {
    // branch out --> array
    for (var i = 0; i < _indexArray.length; i++) {
      result = ___default['default'].merge(result, createTreeDiagram({
        commitHashMap: commitHashMap,
        index: _indexArray[i] - 1,
        level: level + 1,
        size: size - 1,
        path: path,
        onlyCurrentBranch: onlyCurrentBranch,
        before: before - 1
      }));
    }

    return result;
  } else {
    return createTreeDiagram({
      commitHashMap: commitHashMap,
      index: index,
      level: level + 1,
      size: size - 1,
      path: path,
      onlyCurrentBranch: onlyCurrentBranch,
      before: before - 1
    });
  }
}

function createTreeDiagramD3(_x) {
  return _createTreeDiagramD.apply(this, arguments);
}

function _createTreeDiagramD() {
  _createTreeDiagramD = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee9(_ref3) {
    var commitHashMap, _ref3$index, index, _ref3$level, level, _ref3$size, size, _ref3$path, path, _ref3$onlyCurrentBran, onlyCurrentBranch, _ref3$before, before, currentCommit, getCommitInfo, ignore, format, client, result, currentIndex, commitHash, _result$body$hits$hit3, _result$body3, _result$body3$hits, _result$body3$hits$hi, _result$body3$hits$hi2, _result, info, _iterator, _step, _info2, _ignore, _info, _tmp, _i5, _Object$entries, _Object$entries$_i, key, value, targetIndex, closestIndex, child, nextTwoIndex, nextSameLevelIndex, _indexArray, _index, i, _child, _child2;

    return _regeneratorRuntime__default['default'].wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            commitHashMap = _ref3.commitHashMap, _ref3$index = _ref3.index, index = _ref3$index === void 0 ? 0 : _ref3$index, _ref3$level = _ref3.level, level = _ref3$level === void 0 ? 0 : _ref3$level, _ref3$size = _ref3.size, size = _ref3$size === void 0 ? 10 : _ref3$size, _ref3$path = _ref3.path, path = _ref3$path === void 0 ? "" : _ref3$path, _ref3$onlyCurrentBran = _ref3.onlyCurrentBranch, onlyCurrentBranch = _ref3$onlyCurrentBran === void 0 ? false : _ref3$onlyCurrentBran, _ref3$before = _ref3.before, before = _ref3$before === void 0 ? 5 : _ref3$before, currentCommit = _ref3.currentCommit, getCommitInfo = _ref3.getCommitInfo, ignore = _ref3.ignore, format = _ref3.format, client = _ref3.client;
            result = {};
            result.children = [];
            currentIndex = index;
            commitHash = commitHashMap.substring(index + 1 + level.toString().length + 1, index + 1 + level.toString().length + 1 + 40);
            result.name = commitHash;

            if (commitHash === currentCommit) {
              result.currentCommit = true;
            }

            if (!getCommitInfo) {
              _context9.next = 16;
              break;
            }

            _context9.next = 10;
            return queryElasticseaerch({
              commitHashArray: [commitHash],
              client: client
            });

          case 10:
            _result = _context9.sent;
            info = (_result$body$hits$hit3 = _result === null || _result === void 0 ? void 0 : (_result$body3 = _result.body) === null || _result$body3 === void 0 ? void 0 : (_result$body3$hits = _result$body3.hits) === null || _result$body3$hits === void 0 ? void 0 : (_result$body3$hits$hi = _result$body3$hits.hits) === null || _result$body3$hits$hi === void 0 ? void 0 : (_result$body3$hits$hi2 = _result$body3$hits$hi[0]) === null || _result$body3$hits$hi2 === void 0 ? void 0 : _result$body3$hits$hi2._source) !== null && _result$body$hits$hit3 !== void 0 ? _result$body$hits$hit3 : {};
            _iterator = _createForOfIteratorHelper(ignore);

            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                _ignore = _step.value;

                if ((_info2 = info) !== null && _info2 !== void 0 && _info2[_ignore]) {
                  delete info[_ignore];
                }
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }

            if (format === "text") {
              _tmp = (_info = info) !== null && _info !== void 0 ? _info : {};
              info = [];

              for (_i5 = 0, _Object$entries = Object.entries(_tmp); _i5 < _Object$entries.length; _i5++) {
                _Object$entries$_i = _slicedToArray__default['default'](_Object$entries[_i5], 2), key = _Object$entries$_i[0], value = _Object$entries$_i[1];
                info.push("".concat(key, ": ").concat(value));
              }

              info = info.join("\n");
            }

            result.info = info;

          case 16:
            index = commitHashMap.indexOf("^".concat(level + 1, "_"), index);

            if (!(new RegExp('\\^[0-9]{1,}_').test(commitHashMap.substring(currentIndex + 2, index - 1)) || index === -1 || size <= 0)) {
              _context9.next = 20;
              break;
            }

            // currentIndex + 2 for handling getRightmostIndexBeforeEnd case
            // if have other level between current level & next level or no next level --> current level is branch out / head --> no children --> return 
            delete result.children;
            return _context9.abrupt("return", result);

          case 20:
            if (!(onlyCurrentBranch && before > 0)) {
              _context9.next = 28;
              break;
            }

            targetIndex = commitHashMap.indexOf("_".concat(currentCommit));
            closestIndex = getRightmostIndexBeforeEnd({
              input: commitHashMap.substring(0, targetIndex),
              searchText: "^".concat(level + 1, "_"),
              index: index,
              end: targetIndex
            });
            _context9.next = 25;
            return createTreeDiagramD3({
              commitHashMap: commitHashMap,
              index: closestIndex,
              level: level + 1,
              size: size - 1,
              path: path,
              onlyCurrentBranch: onlyCurrentBranch,
              before: before - 1,
              getCommitInfo: getCommitInfo,
              currentCommit: currentCommit,
              ignore: ignore,
              format: format,
              client: client
            });

          case 25:
            child = _context9.sent;
            result.children.push(child);
            return _context9.abrupt("return", result);

          case 28:
            // branch out checking
            nextTwoIndex = commitHashMap.indexOf("^".concat(level + 2, "_"), index);

            if (nextTwoIndex === -1) {
              nextTwoIndex = commitHashMap.length;
            }

            nextSameLevelIndex = commitHashMap.indexOf("^".concat(level, "_"), index + 1);
            _indexArray = [];
            _index = commitHashMap.indexOf("^".concat(level + 1, "_"), index);

            while (_index !== -1 && _index < (nextSameLevelIndex != -1 ? nextSameLevelIndex : commitHashMap.length)) {
              _indexArray.push(_index);

              _index = commitHashMap.indexOf("^".concat(level + 1, "_"), _index + 1);
            }

            if (!(_indexArray.length > 1)) {
              _context9.next = 47;
              break;
            }

            i = 0;

          case 36:
            if (!(i < _indexArray.length)) {
              _context9.next = 44;
              break;
            }

            _context9.next = 39;
            return createTreeDiagramD3({
              commitHashMap: commitHashMap,
              index: _indexArray[i],
              level: level + 1,
              size: size - 1,
              path: path,
              onlyCurrentBranch: onlyCurrentBranch,
              before: before - 1,
              getCommitInfo: getCommitInfo,
              currentCommit: currentCommit,
              ignore: ignore,
              format: format,
              client: client
            });

          case 39:
            _child = _context9.sent;
            result.children.push(_child);

          case 41:
            i++;
            _context9.next = 36;
            break;

          case 44:
            return _context9.abrupt("return", result);

          case 47:
            _context9.next = 49;
            return createTreeDiagramD3({
              commitHashMap: commitHashMap,
              index: index,
              level: level + 1,
              size: size - 1,
              path: path,
              onlyCurrentBranch: onlyCurrentBranch,
              before: before - 1,
              getCommitInfo: getCommitInfo,
              currentCommit: currentCommit,
              ignore: ignore,
              format: format,
              client: client
            });

          case 49:
            _child2 = _context9.sent;
            result.children.push(_child2);
            return _context9.abrupt("return", result);

          case 52:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9);
  }));
  return _createTreeDiagramD.apply(this, arguments);
}

function queryElasticseaerch(_x2) {
  return _queryElasticseaerch.apply(this, arguments);
}

function _queryElasticseaerch() {
  _queryElasticseaerch = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee10(_ref4) {
    var commitHashArray, client, result;
    return _regeneratorRuntime__default['default'].wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            commitHashArray = _ref4.commitHashArray, client = _ref4.client;
            _context10.next = 3;
            return elasticsearchSearch({
              commitHashArray: commitHashArray,
              size: commitHashArray.length,
              client: client
            });

          case 3:
            result = _context10.sent;
            return _context10.abrupt("return", result);

          case 5:
          case "end":
            return _context10.stop();
        }
      }
    }, _callee10);
  }));
  return _queryElasticseaerch.apply(this, arguments);
}

function addCurrentCommit(_ref5) {
  var input = _ref5.input,
      currentCommit = _ref5.currentCommit;
  var result = {};
  var inputKeys = Object.keys(input);

  for (var i = 0; i < inputKeys.length; i++) {
    var _tmp = addCurrentCommit({
      input: input[inputKeys[i]],
      currentCommit: currentCommit
    });

    if (currentCommit === inputKeys[i]) {
      result[inputKeys[i]] = _objectSpread$1(_objectSpread$1({}, _tmp), {}, {
        currentCommit: true
      });
    } else {
      result[inputKeys[i]] = _objectSpread$1({}, _tmp);
    }
  }

  return result;
}

function getCommitHashInfo(_x3) {
  return _getCommitHashInfo.apply(this, arguments);
}

function _getCommitHashInfo() {
  _getCommitHashInfo = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee11(_ref6) {
    var input, client, currentCommit, result, inputKeys, i, info, _tmp, _info$body, _info$body$hits, _info$body$hits$hits, _info$body$hits$hits$, _info$body2, _info$body2$hits, _info$body2$hits$hits, _info$body2$hits$hits2;

    return _regeneratorRuntime__default['default'].wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            input = _ref6.input, client = _ref6.client, currentCommit = _ref6.currentCommit;
            result = {};
            inputKeys = Object.keys(input);
            i = 0;

          case 4:
            if (!(i < inputKeys.length)) {
              _context11.next = 15;
              break;
            }

            _context11.next = 7;
            return queryElasticseaerch({
              commitHashArray: [inputKeys[i]],
              client: client
            });

          case 7:
            info = _context11.sent;
            _context11.next = 10;
            return getCommitHashInfo({
              input: input[inputKeys[i]],
              client: client,
              currentCommit: currentCommit
            });

          case 10:
            _tmp = _context11.sent;

            if (currentCommit === inputKeys[i]) {
              result[inputKeys[i]] = _objectSpread$1(_objectSpread$1({}, _tmp), {}, {
                info: info === null || info === void 0 ? void 0 : (_info$body = info.body) === null || _info$body === void 0 ? void 0 : (_info$body$hits = _info$body.hits) === null || _info$body$hits === void 0 ? void 0 : (_info$body$hits$hits = _info$body$hits.hits) === null || _info$body$hits$hits === void 0 ? void 0 : (_info$body$hits$hits$ = _info$body$hits$hits[0]) === null || _info$body$hits$hits$ === void 0 ? void 0 : _info$body$hits$hits$._source,
                currentCommit: true
              });
            } else {
              result[inputKeys[i]] = _objectSpread$1(_objectSpread$1({}, _tmp), {}, {
                info: info === null || info === void 0 ? void 0 : (_info$body2 = info.body) === null || _info$body2 === void 0 ? void 0 : (_info$body2$hits = _info$body2.hits) === null || _info$body2$hits === void 0 ? void 0 : (_info$body2$hits$hits = _info$body2$hits.hits) === null || _info$body2$hits$hits === void 0 ? void 0 : (_info$body2$hits$hits2 = _info$body2$hits$hits[0]) === null || _info$body2$hits$hits2 === void 0 ? void 0 : _info$body2$hits$hits2._source
              });
            }

          case 12:
            i++;
            _context11.next = 4;
            break;

          case 15:
            return _context11.abrupt("return", result);

          case 16:
          case "end":
            return _context11.stop();
        }
      }
    }, _callee11);
  }));
  return _getCommitHashInfo.apply(this, arguments);
}

function getChanges(_ref7) {
  var _ref7$changed = _ref7.changed,
      changed = _ref7$changed === void 0 ? {
    added: {},
    deleted: {},
    updated: {}
  } : _ref7$changed,
      revert = _ref7.revert;
  var addedChange = diffParser(changed.added, "after");
  var deletedChange = diffParser(changed.deleted, "before");
  var updatedChange;

  if (revert) {
    updatedChange = diffParser(changed.updated, "before");
  } else {
    updatedChange = diffParser(changed.updated, "after");
  }

  return {
    addedChange: addedChange,
    deletedChange: deletedChange,
    updatedChange: updatedChange
  };
}

function getShortestPath(_ref8) {
  var _parseInt, _commitHashMap$match$, _commitHashMap$match, _parseInt2, _commitHashMap$match$2, _commitHashMap$match2;

  var commitHashMap = _ref8.commitHashMap,
      commitHash = _ref8.commitHash,
      currentCommit = _ref8.currentCommit;
  var currentLevel = (_parseInt = parseInt((_commitHashMap$match$ = (_commitHashMap$match = commitHashMap.match(new RegExp("\\^([0-9]+)_".concat(currentCommit)))) === null || _commitHashMap$match === void 0 ? void 0 : _commitHashMap$match[1]) !== null && _commitHashMap$match$ !== void 0 ? _commitHashMap$match$ : 0, 10)) !== null && _parseInt !== void 0 ? _parseInt : 0;
  var targetLevel = (_parseInt2 = parseInt((_commitHashMap$match$2 = (_commitHashMap$match2 = commitHashMap.match(new RegExp("\\^([0-9]+)_".concat(commitHash)))) === null || _commitHashMap$match2 === void 0 ? void 0 : _commitHashMap$match2[1]) !== null && _commitHashMap$match$2 !== void 0 ? _commitHashMap$match$2 : 0, 10)) !== null && _parseInt2 !== void 0 ? _parseInt2 : 0;
  var currentIndex = commitHashMap.indexOf("^".concat(currentLevel, "_").concat(currentCommit));
  var targetIndex = commitHashMap.indexOf("^".concat(targetLevel, "_").concat(commitHash));
  var forward = [];
  var backward = [];

  if (currentLevel > targetLevel) {
    // current level revert to target level ---> same = end & different = find common point
    var difference = currentLevel - targetLevel;

    for (var i = 0; i < difference; i++) {
      var _tmp = getRightmostIndexBeforeEnd({
        input: commitHashMap.substring(0, currentIndex),
        searchText: "^".concat(currentLevel - 1 - i, "_"),
        end: currentIndex
      });

      backward.push(commitHashMap.substring(_tmp + 1 + (currentLevel - 1 - i).toString().length + 1, _tmp + 1 + (currentLevel - 1 - i).toString().length + 1 + 40));
    }

    if (backward[backward.length - 1] === commitHash) {
      return {
        backward: backward
      };
    }

    var result = getShortestPath({
      commitHashMap: commitHashMap.substring(0, Math.max(commitHashMap.indexOf("^".concat(currentLevel - difference, "_").concat(backward[backward.length - 1])) + 2 + (currentLevel - difference) + 40, targetIndex + 2 + targetLevel.toString().length + 40)),
      commitHash: commitHash,
      currentCommit: backward[backward.length - 1]
    });
    return {
      forward: result.forward,
      backward: backward.concat(result.backward)
    };
  } else if (currentLevel < targetLevel) {
    var _result4$forward;

    // target revert to same level --> same = end & diffent = find common point
    forward.push(commitHash);

    var _difference = targetLevel - currentLevel;

    for (var _i = 0; _i < _difference; _i++) {
      var _tmp2 = getRightmostIndexBeforeEnd({
        input: commitHashMap.substring(0, targetIndex),
        searchText: "^".concat(targetLevel - 1 - _i, "_"),
        end: targetIndex
      });

      forward.push(commitHashMap.substring(_tmp2 + 1 + (targetLevel - 1 - _i).toString().length + 1, _tmp2 + 1 + (targetLevel - 1 - _i).toString().length + 1 + 40)); //reversed
    }

    if (forward[forward.length - 1] === currentCommit) {
      return {
        forward: forward
      };
    }

    var _result4 = getShortestPath({
      commitHashMap: commitHashMap.substring(0, Math.max(commitHashMap.indexOf("^".concat(targetLevel - _difference, "_").concat(forward[forward.length - 1])) + 2 + (targetLevel - _difference).toString().length + 40, currentIndex + 2 + currentLevel.toString().length + 40)),
      commitHash: forward[forward.length - 1],
      currentCommit: currentCommit
    });

    forward.pop();
    return {
      forward: forward.concat((_result4$forward = _result4.forward) !== null && _result4$forward !== void 0 ? _result4$forward : []),
      backward: _result4.backward
    };
  } else if (currentLevel === targetLevel) {
    if (currentIndex === targetIndex) {
      return {};
    } // both backward 10 --> check same or not --> same = remove duplicated value & diff = re run


    for (var _i2 = 0; _i2 < 10; _i2++) {
      var _tmp3 = getRightmostIndexBeforeEnd({
        input: commitHashMap.substring(0, currentIndex),
        searchText: "^".concat(currentLevel - 1 - _i2, "_"),
        end: currentIndex
      });

      if (_tmp3 !== -1) {
        backward.push(commitHashMap.substring(_tmp3 + 1 + (currentLevel - 1 - _i2).toString().length + 1, _tmp3 + 1 + (currentLevel - 1 - _i2).toString().length + 1 + 40));
      } else {
        break;
      }
    }

    forward.push(commitHash);

    for (var _i3 = 0; _i3 < 10; _i3++) {
      var _tmp4 = getRightmostIndexBeforeEnd({
        input: commitHashMap.substring(0, targetIndex),
        searchText: "^".concat(targetLevel - 1 - _i3, "_"),
        end: targetIndex
      });

      if (_tmp4 !== -1) {
        forward.push(commitHashMap.substring(_tmp4 + 1 + (targetLevel - 1 - _i3).toString().length + 1, _tmp4 + 1 + (targetLevel - 1 - _i3).toString().length + 1 + 40));
      } else {
        break;
      }
    }

    while (forward[forward.length - 2] === backward[backward.length - 2] && (backward[backward.length - 2] !== undefined || isNaN(backward[backward.length - 2]))) {
      forward.pop();
      backward.pop();
    }

    if (forward[forward.length - 1] === backward[backward.length - 1]) {
      return {
        forward: forward,
        backward: backward
      };
    }

    return getShortestPath({
      commitHashMap: commitHashMap.substring(0, Math.max(forward[forward.length - 1], backward[backward.length - 1])),
      commitHash: commitHashMap.substring(forward[forward.length - 1] + 1 + (targetLevel - 1 - 10).toString().length + 1, forward[forward.length - 1] + 1 + (targetLevel - 1 - 10).toString().length + 1 + 40),
      currentCommit: commitHashMap.substring(backward[backward.length - 1] + 1 + (currentLevel - 1 - 10).toString().length + 1, backward[backward.length - 1] + 1 + (currentLevel - 1 - 10).toString().length + 1 + 40)
    });
  }
} // Get commit hash info by ID


auditTrail.prototype.queryByCommitHash = /*#__PURE__*/function () {
  var _ref10 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee(_ref9) {
    var _result$body, _result$body$hits, _result$body$hits$hit, _result$body$hits$hit2;

    var commitHash, result;
    return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            commitHash = _ref9.commitHash;
            _context.next = 3;
            return queryElasticseaerch({
              commitHashArray: [commitHash],
              client: this.client
            });

          case 3:
            result = _context.sent;
            return _context.abrupt("return", result === null || result === void 0 ? void 0 : (_result$body = result.body) === null || _result$body === void 0 ? void 0 : (_result$body$hits = _result$body.hits) === null || _result$body$hits === void 0 ? void 0 : (_result$body$hits$hit = _result$body$hits.hits) === null || _result$body$hits$hit === void 0 ? void 0 : (_result$body$hits$hit2 = _result$body$hits$hit[0]) === null || _result$body$hits$hit2 === void 0 ? void 0 : _result$body$hits$hit2._source);

          case 5:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function (_x4) {
    return _ref10.apply(this, arguments);
  };
}(); // Get multiple commit hash info by IDs


auditTrail.prototype.batchQueryByCommitHash = /*#__PURE__*/function () {
  var _ref12 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee2(_ref11) {
    var _result$body2, _result$body2$hits, _result$body2$hits$hi;

    var commitHashArray, result;
    return _regeneratorRuntime__default['default'].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            commitHashArray = _ref11.commitHashArray;
            _context2.next = 3;
            return queryElasticseaerch({
              commitHashArray: commitHashArray,
              client: this.client
            });

          case 3:
            result = _context2.sent;
            return _context2.abrupt("return", result === null || result === void 0 ? void 0 : (_result$body2 = result.body) === null || _result$body2 === void 0 ? void 0 : (_result$body2$hits = _result$body2.hits) === null || _result$body2$hits === void 0 ? void 0 : (_result$body2$hits$hi = _result$body2$hits.hits) === null || _result$body2$hits$hi === void 0 ? void 0 : _result$body2$hits$hi.map(function (data) {
              return data === null || data === void 0 ? void 0 : data._source;
            }));

          case 5:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function (_x5) {
    return _ref12.apply(this, arguments);
  };
}(); // Query for tree object array


auditTrail.prototype.query = /*#__PURE__*/function () {
  var _ref14 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee3(_ref13) {
    var _Object$keys, _parseInt3, _commitHashMap$match$3, _commitHashMap$match3;

    var _ref13$commitHashMap, commitHashMap, _ref13$commitHash, commitHash, _ref13$before, before, _ref13$after, after, _ref13$onlyCurrentBra, onlyCurrentBranch, _ref13$getCommitInfo, getCommitInfo, commitMap, currentLevel, startingIndexArray, currentIndex, _index, index, realIndexArray, j, startingIndex, realStart, result;

    return _regeneratorRuntime__default['default'].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _ref13$commitHashMap = _ref13.commitHashMap, commitHashMap = _ref13$commitHashMap === void 0 ? "{}" : _ref13$commitHashMap, _ref13$commitHash = _ref13.commitHash, commitHash = _ref13$commitHash === void 0 ? "" : _ref13$commitHash, _ref13$before = _ref13.before, before = _ref13$before === void 0 ? 5 : _ref13$before, _ref13$after = _ref13.after, after = _ref13$after === void 0 ? 5 : _ref13$after, _ref13$onlyCurrentBra = _ref13.onlyCurrentBranch, onlyCurrentBranch = _ref13$onlyCurrentBra === void 0 ? false : _ref13$onlyCurrentBra, _ref13$getCommitInfo = _ref13.getCommitInfo, getCommitInfo = _ref13$getCommitInfo === void 0 ? true : _ref13$getCommitInfo;
            commitMap = yamlLikeStringParser({
              input: commitHashMap
            });

            if (!(((_Object$keys = Object.keys(commitMap)) === null || _Object$keys === void 0 ? void 0 : _Object$keys.length) === 0 || !commitHash || before === 0 && after === 0)) {
              _context3.next = 5;
              break;
            }

            console.log("CommitHashMap or commitHash empty or both before and after size set 0");
            return _context3.abrupt("return", []);

          case 5:
            currentLevel = (_parseInt3 = parseInt((_commitHashMap$match$3 = (_commitHashMap$match3 = commitHashMap.match(new RegExp("\\^([0-9]+)_".concat(commitHash)))) === null || _commitHashMap$match3 === void 0 ? void 0 : _commitHashMap$match3[1]) !== null && _commitHashMap$match$3 !== void 0 ? _commitHashMap$match$3 : 0, 10)) !== null && _parseInt3 !== void 0 ? _parseInt3 : 0;
            startingIndexArray = [];
            currentIndex = commitHashMap.indexOf("^".concat(currentLevel, "_").concat(commitHash));

            if (!onlyCurrentBranch) {
              _index = commitHashMap.indexOf("^".concat(currentLevel - before > 0 ? currentLevel - before : 0, "_"));

              while (_index != -1) {
                startingIndexArray.push(_index);
                _index = commitHashMap.indexOf("^".concat(currentLevel - before > 0 ? currentLevel - before : 0, "_"), _index + 1);
              }
            } else {
              index = getRightmostIndexBeforeEnd({
                input: commitHashMap.substring(0, currentIndex),
                searchText: "^".concat(currentIndex - before, "_"),
                end: currentIndex
              });
              startingIndexArray = [index];
            }

            realIndexArray = [];
            j = 0;

          case 11:
            if (!(j < startingIndexArray.length)) {
              _context3.next = 26;
              break;
            }

            startingIndex = startingIndexArray[j];
            realStart = currentLevel - before > 0 ? currentLevel - before : 0;
            result = createTreeDiagram({
              commitHashMap: commitHashMap,
              index: startingIndex,
              level: realStart,
              size: before + after,
              path: "",
              onlyCurrentBranch: onlyCurrentBranch,
              before: before > currentLevel ? currentLevel : before,
              currentCommit: commitHash
            });

            if (!getCommitInfo) {
              _context3.next = 21;
              break;
            }

            _context3.next = 18;
            return getCommitHashInfo({
              input: result,
              client: this.client,
              currentCommit: commitHash
            });

          case 18:
            result = _context3.sent;
            _context3.next = 22;
            break;

          case 21:
            result = addCurrentCommit({
              input: result,
              currentCommit: commitHash
            });

          case 22:
            realIndexArray.push(result);

          case 23:
            j++;
            _context3.next = 11;
            break;

          case 26:
            return _context3.abrupt("return", realIndexArray);

          case 27:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function (_x6) {
    return _ref14.apply(this, arguments);
  };
}(); // Query for D3 tree object array


auditTrail.prototype.queryD3 = /*#__PURE__*/function () {
  var _ref16 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee4(_ref15) {
    var _Object$keys2, _parseInt4, _commitHashMap$match$4, _commitHashMap$match4;

    var _ref15$commitHashMap, commitHashMap, _ref15$commitHash, commitHash, _ref15$before, before, _ref15$after, after, _ref15$onlyCurrentBra, onlyCurrentBranch, _ref15$getCommitInfo, getCommitInfo, _ref15$ignore, ignore, _ref15$format, format, commitMap, currentLevel, startingIndexArray, currentIndex, _index, index, realIndexArray, j, startingIndex, realStart, result;

    return _regeneratorRuntime__default['default'].wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _ref15$commitHashMap = _ref15.commitHashMap, commitHashMap = _ref15$commitHashMap === void 0 ? "{}" : _ref15$commitHashMap, _ref15$commitHash = _ref15.commitHash, commitHash = _ref15$commitHash === void 0 ? "" : _ref15$commitHash, _ref15$before = _ref15.before, before = _ref15$before === void 0 ? 5 : _ref15$before, _ref15$after = _ref15.after, after = _ref15$after === void 0 ? 5 : _ref15$after, _ref15$onlyCurrentBra = _ref15.onlyCurrentBranch, onlyCurrentBranch = _ref15$onlyCurrentBra === void 0 ? false : _ref15$onlyCurrentBra, _ref15$getCommitInfo = _ref15.getCommitInfo, getCommitInfo = _ref15$getCommitInfo === void 0 ? true : _ref15$getCommitInfo, _ref15$ignore = _ref15.ignore, ignore = _ref15$ignore === void 0 ? [] : _ref15$ignore, _ref15$format = _ref15.format, format = _ref15$format === void 0 ? "object" : _ref15$format;

            if (typeof ignore === "string") {
              ignore = [ignore];
            }

            commitMap = yamlLikeStringParser({
              input: commitHashMap
            });

            if (!(((_Object$keys2 = Object.keys(commitMap)) === null || _Object$keys2 === void 0 ? void 0 : _Object$keys2.length) === 0 || !commitHash || before === 0 && after === 0)) {
              _context4.next = 6;
              break;
            }

            console.log("CommitHashMap or commitHash empty or both before and after size set 0");
            return _context4.abrupt("return", []);

          case 6:
            currentLevel = (_parseInt4 = parseInt((_commitHashMap$match$4 = (_commitHashMap$match4 = commitHashMap.match(new RegExp("\\^([0-9]+)_".concat(commitHash)))) === null || _commitHashMap$match4 === void 0 ? void 0 : _commitHashMap$match4[1]) !== null && _commitHashMap$match$4 !== void 0 ? _commitHashMap$match$4 : 0, 10)) !== null && _parseInt4 !== void 0 ? _parseInt4 : 0;
            startingIndexArray = [];
            currentIndex = commitHashMap.indexOf("^".concat(currentLevel, "_").concat(commitHash));

            if (!onlyCurrentBranch) {
              _index = commitHashMap.indexOf("^".concat(currentLevel - before > 0 ? currentLevel - before : 0, "_"));

              while (_index != -1) {
                startingIndexArray.push(_index);
                _index = commitHashMap.indexOf("^".concat(currentLevel - before > 0 ? currentLevel - before : 0, "_"), _index + 1);
              }
            } else {
              index = getRightmostIndexBeforeEnd({
                input: commitHashMap.substring(0, currentIndex),
                searchText: "^".concat(currentIndex - before, "_"),
                end: currentIndex
              });
              startingIndexArray = [index];
            }

            realIndexArray = [];
            j = 0;

          case 12:
            if (!(j < startingIndexArray.length)) {
              _context4.next = 22;
              break;
            }

            startingIndex = startingIndexArray[j];
            realStart = currentLevel - before > 0 ? currentLevel - before : 0; // create tree diagram with starting node starting level (current level - before level)

            _context4.next = 17;
            return createTreeDiagramD3({
              commitHashMap: commitHashMap,
              index: startingIndex,
              level: realStart,
              size: before + after,
              path: "",
              onlyCurrentBranch: onlyCurrentBranch,
              before: before > currentLevel ? currentLevel : before,
              currentCommit: commitHash,
              getCommitInfo: getCommitInfo,
              ignore: ignore,
              format: format,
              client: this.client
            });

          case 17:
            result = _context4.sent;
            realIndexArray.push(result);

          case 19:
            j++;
            _context4.next = 12;
            break;

          case 22:
            return _context4.abrupt("return", realIndexArray);

          case 23:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function (_x7) {
    return _ref16.apply(this, arguments);
  };
}(); // revert specific commit (will create audit trail during revert)


auditTrail.prototype.revertCommit = /*#__PURE__*/function () {
  var _ref18 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee5(_ref17) {
    var _search$body$hits$hit, _search$body, _search$body$hits, _search$body$hits$hit2, _search$body$hits$hit3, _search$body$hits$hit4;

    var commitHash, parentTrail, search, data, _search$body2, _search$body2$hits, _search$body2$hits$hi, _search$body2$hits$hi2, _search$body2$hits$hi3, _search$body4, _search$body4$hits, _search$body4$hits$hi, _search$body4$hits$hi2, _search$body4$hits$hi3, _search$body6, _search$body6$hits, _search$body6$hits$hi, _search$body6$hits$hi2, _search$body6$hits$hi3, _search$body$hits$hit5, _search$body8, _search$body8$hits, _search$body8$hits$hi, _search$body8$hits$hi2, _search$body8$hits$hi3, _search$body9, _search$body9$hits, _search$body9$hits$hi, _search$body9$hits$hi2, _changes$updatedChang3, _changes$updatedChang4, _changes$addedChange5, _changes$addedChange6, _changes$deletedChang5, _changes$deletedChang6, changes, result, _search$body3, _search$body3$hits, _search$body3$hits$hi, _search$body3$hits$hi2, _changes$addedChange, _changes$addedChange2, _search$body5, _search$body5$hits, _search$body5$hits$hi, _search$body5$hits$hi2, _changes$deletedChang, _changes$deletedChang2, _search$body7, _search$body7$hits, _search$body7$hits$hi, _search$body7$hits$hi2, _changes$updatedChang, _changes$updatedChang2, _changes$addedChange3, _changes$addedChange4, _changes$deletedChang3, _changes$deletedChang4;

    return _regeneratorRuntime__default['default'].wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            commitHash = _ref17.commitHash, parentTrail = _ref17.parentTrail;
            _context5.next = 3;
            return queryElasticseaerch({
              commitHashArray: [commitHash],
              client: this.client
            });

          case 3:
            search = _context5.sent;
            data = JSON.parse((_search$body$hits$hit = search === null || search === void 0 ? void 0 : (_search$body = search.body) === null || _search$body === void 0 ? void 0 : (_search$body$hits = _search$body.hits) === null || _search$body$hits === void 0 ? void 0 : (_search$body$hits$hit2 = _search$body$hits.hits) === null || _search$body$hits$hit2 === void 0 ? void 0 : (_search$body$hits$hit3 = _search$body$hits$hit2[0]) === null || _search$body$hits$hit3 === void 0 ? void 0 : (_search$body$hits$hit4 = _search$body$hits$hit3._source) === null || _search$body$hits$hit4 === void 0 ? void 0 : _search$body$hits$hit4.change) !== null && _search$body$hits$hit !== void 0 ? _search$body$hits$hit : null);

            if (!data) {
              _context5.next = 31;
              break;
            }

            changes = getChanges({
              changed: data,
              revert: true
            });
            result = {};

            if (!((search === null || search === void 0 ? void 0 : (_search$body2 = search.body) === null || _search$body2 === void 0 ? void 0 : (_search$body2$hits = _search$body2.hits) === null || _search$body2$hits === void 0 ? void 0 : (_search$body2$hits$hi = _search$body2$hits.hits) === null || _search$body2$hits$hi === void 0 ? void 0 : (_search$body2$hits$hi2 = _search$body2$hits$hi[0]) === null || _search$body2$hits$hi2 === void 0 ? void 0 : (_search$body2$hits$hi3 = _search$body2$hits$hi2._source) === null || _search$body2$hits$hi3 === void 0 ? void 0 : _search$body2$hits$hi3.action) === "CREATE")) {
              _context5.next = 15;
              break;
            }

            _context5.next = 11;
            return this.databaseDeleteOneRowFunction({
              data: search === null || search === void 0 ? void 0 : (_search$body3 = search.body) === null || _search$body3 === void 0 ? void 0 : (_search$body3$hits = _search$body3.hits) === null || _search$body3$hits === void 0 ? void 0 : (_search$body3$hits$hi = _search$body3$hits.hits) === null || _search$body3$hits$hi === void 0 ? void 0 : (_search$body3$hits$hi2 = _search$body3$hits$hi[0]) === null || _search$body3$hits$hi2 === void 0 ? void 0 : _search$body3$hits$hi2._source,
              changedObj: (_changes$addedChange = changes.addedChange) === null || _changes$addedChange === void 0 ? void 0 : _changes$addedChange.diff,
              flattedchanged: (_changes$addedChange2 = changes.addedChange) === null || _changes$addedChange2 === void 0 ? void 0 : _changes$addedChange2.change,
              auditTrail: true,
              parentTrail: parentTrail
            });

          case 11:
            result.deleted = _context5.sent;
            return _context5.abrupt("return", result);

          case 15:
            if (!((search === null || search === void 0 ? void 0 : (_search$body4 = search.body) === null || _search$body4 === void 0 ? void 0 : (_search$body4$hits = _search$body4.hits) === null || _search$body4$hits === void 0 ? void 0 : (_search$body4$hits$hi = _search$body4$hits.hits) === null || _search$body4$hits$hi === void 0 ? void 0 : (_search$body4$hits$hi2 = _search$body4$hits$hi[0]) === null || _search$body4$hits$hi2 === void 0 ? void 0 : (_search$body4$hits$hi3 = _search$body4$hits$hi2._source) === null || _search$body4$hits$hi3 === void 0 ? void 0 : _search$body4$hits$hi3.action) === "DELETE")) {
              _context5.next = 22;
              break;
            }

            _context5.next = 18;
            return this.databaseAddOneRowFunction({
              data: search === null || search === void 0 ? void 0 : (_search$body5 = search.body) === null || _search$body5 === void 0 ? void 0 : (_search$body5$hits = _search$body5.hits) === null || _search$body5$hits === void 0 ? void 0 : (_search$body5$hits$hi = _search$body5$hits.hits) === null || _search$body5$hits$hi === void 0 ? void 0 : (_search$body5$hits$hi2 = _search$body5$hits$hi[0]) === null || _search$body5$hits$hi2 === void 0 ? void 0 : _search$body5$hits$hi2._source,
              changedObj: (_changes$deletedChang = changes.deletedChange) === null || _changes$deletedChang === void 0 ? void 0 : _changes$deletedChang.diff,
              flattedchanged: (_changes$deletedChang2 = changes.deletedChange) === null || _changes$deletedChang2 === void 0 ? void 0 : _changes$deletedChang2.change,
              auditTrail: true,
              parentTrail: parentTrail
            });

          case 18:
            result.added = _context5.sent;
            return _context5.abrupt("return", result);

          case 22:
            if (!((search === null || search === void 0 ? void 0 : (_search$body6 = search.body) === null || _search$body6 === void 0 ? void 0 : (_search$body6$hits = _search$body6.hits) === null || _search$body6$hits === void 0 ? void 0 : (_search$body6$hits$hi = _search$body6$hits.hits) === null || _search$body6$hits$hi === void 0 ? void 0 : (_search$body6$hits$hi2 = _search$body6$hits$hi[0]) === null || _search$body6$hits$hi2 === void 0 ? void 0 : (_search$body6$hits$hi3 = _search$body6$hits$hi2._source) === null || _search$body6$hits$hi3 === void 0 ? void 0 : _search$body6$hits$hi3.action) === "UPDATE")) {
              _context5.next = 27;
              break;
            }

            _context5.next = 25;
            return this.databaseUpdateOneRowFunction({
              data: search === null || search === void 0 ? void 0 : (_search$body7 = search.body) === null || _search$body7 === void 0 ? void 0 : (_search$body7$hits = _search$body7.hits) === null || _search$body7$hits === void 0 ? void 0 : (_search$body7$hits$hi = _search$body7$hits.hits) === null || _search$body7$hits$hi === void 0 ? void 0 : (_search$body7$hits$hi2 = _search$body7$hits$hi[0]) === null || _search$body7$hits$hi2 === void 0 ? void 0 : _search$body7$hits$hi2._source,
              changedObj: (_changes$updatedChang = changes.updatedChange) === null || _changes$updatedChang === void 0 ? void 0 : _changes$updatedChang.diff,
              flattedchanged: (_changes$updatedChang2 = changes.updatedChange) === null || _changes$updatedChang2 === void 0 ? void 0 : _changes$updatedChang2.change,
              addChangedObj: (_changes$addedChange3 = changes.addedChange) === null || _changes$addedChange3 === void 0 ? void 0 : _changes$addedChange3.diff,
              addFlattedchanged: (_changes$addedChange4 = changes.addedChange) === null || _changes$addedChange4 === void 0 ? void 0 : _changes$addedChange4.change,
              deleteChangedObj: (_changes$deletedChang3 = changes.deletedChange) === null || _changes$deletedChang3 === void 0 ? void 0 : _changes$deletedChang3.diff,
              deleteFlattedchanged: (_changes$deletedChang4 = changes.deletedChange) === null || _changes$deletedChang4 === void 0 ? void 0 : _changes$deletedChang4.change
            });

          case 25:
            result.updated = _context5.sent;
            return _context5.abrupt("return", result);

          case 27:
            _context5.next = 29;
            return this.databaseCustomFunction({
              action: (_search$body$hits$hit5 = search === null || search === void 0 ? void 0 : (_search$body8 = search.body) === null || _search$body8 === void 0 ? void 0 : (_search$body8$hits = _search$body8.hits) === null || _search$body8$hits === void 0 ? void 0 : (_search$body8$hits$hi = _search$body8$hits.hits) === null || _search$body8$hits$hi === void 0 ? void 0 : (_search$body8$hits$hi2 = _search$body8$hits$hi[0]) === null || _search$body8$hits$hi2 === void 0 ? void 0 : (_search$body8$hits$hi3 = _search$body8$hits$hi2._source) === null || _search$body8$hits$hi3 === void 0 ? void 0 : _search$body8$hits$hi3.action) !== null && _search$body$hits$hit5 !== void 0 ? _search$body$hits$hit5 : "ERROR",
              data: search === null || search === void 0 ? void 0 : (_search$body9 = search.body) === null || _search$body9 === void 0 ? void 0 : (_search$body9$hits = _search$body9.hits) === null || _search$body9$hits === void 0 ? void 0 : (_search$body9$hits$hi = _search$body9$hits.hits) === null || _search$body9$hits$hi === void 0 ? void 0 : (_search$body9$hits$hi2 = _search$body9$hits$hi[0]) === null || _search$body9$hits$hi2 === void 0 ? void 0 : _search$body9$hits$hi2._source,
              changedObj: (_changes$updatedChang3 = changes.updatedChange) === null || _changes$updatedChang3 === void 0 ? void 0 : _changes$updatedChang3.diff,
              flattedchanged: (_changes$updatedChang4 = changes.updatedChange) === null || _changes$updatedChang4 === void 0 ? void 0 : _changes$updatedChang4.change,
              addChangedObj: (_changes$addedChange5 = changes.addedChange) === null || _changes$addedChange5 === void 0 ? void 0 : _changes$addedChange5.diff,
              addFlattedchanged: (_changes$addedChange6 = changes.addedChange) === null || _changes$addedChange6 === void 0 ? void 0 : _changes$addedChange6.change,
              deleteChangedObj: (_changes$deletedChang5 = changes.deletedChange) === null || _changes$deletedChang5 === void 0 ? void 0 : _changes$deletedChang5.diff,
              deleteFlattedchanged: (_changes$deletedChang6 = changes.deletedChange) === null || _changes$deletedChang6 === void 0 ? void 0 : _changes$deletedChang6.change
            });

          case 29:
            result.updated = _context5.sent;
            return _context5.abrupt("return", result);

          case 31:
            return _context5.abrupt("return", null);

          case 32:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function (_x8) {
    return _ref18.apply(this, arguments);
  };
}(); // revert multiple time to checkout previous commit or switch branch


auditTrail.prototype.checkout = /*#__PURE__*/function () {
  var _ref20 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee6(_ref19) {
    var commitHashMap, commitHash, currentCommit, result;
    return _regeneratorRuntime__default['default'].wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            commitHashMap = _ref19.commitHashMap, commitHash = _ref19.commitHash, currentCommit = _ref19.currentCommit;
            console.log("commitHashMap", commitHashMap);
            console.log("commitHash", commitHash);
            console.log("currentCommit", currentCommit);

            if (!(commitHash === currentCommit)) {
              _context6.next = 6;
              break;
            }

            return _context6.abrupt("return", {});

          case 6:
            result = getShortestPath({
              commitHashMap: commitHashMap,
              commitHash: commitHash,
              currentCommit: currentCommit
            });
            return _context6.abrupt("return", result);

          case 8:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6);
  }));

  return function (_x9) {
    return _ref20.apply(this, arguments);
  };
}(); // pick one commit to run again


auditTrail.prototype.cherryPick = /*#__PURE__*/function () {
  var _ref22 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee7(_ref21) {
    var _search$body$hits$hit6, _search$body10, _search$body10$hits, _search$body10$hits$h, _search$body10$hits$h2, _search$body10$hits$h3;

    var commitHash, parentTrail, search, data, _search$body11, _search$body11$hits, _search$body11$hits$h, _search$body11$hits$h2, _search$body11$hits$h3, _search$body13, _search$body13$hits, _search$body13$hits$h, _search$body13$hits$h2, _search$body13$hits$h3, _search$body15, _search$body15$hits, _search$body15$hits$h, _search$body15$hits$h2, _search$body15$hits$h3, _search$body$hits$hit7, _search$body17, _search$body17$hits, _search$body17$hits$h, _search$body17$hits$h2, _search$body17$hits$h3, _search$body18, _search$body18$hits, _search$body18$hits$h, _search$body18$hits$h2, _changes$updatedChang7, _changes$updatedChang8, _changes$addedChange11, _changes$addedChange12, _changes$deletedChang11, _changes$deletedChang12, changes, result, _search$body12, _search$body12$hits, _search$body12$hits$h, _search$body12$hits$h2, _changes$deletedChang7, _changes$deletedChang8, _search$body14, _search$body14$hits, _search$body14$hits$h, _search$body14$hits$h2, _changes$addedChange7, _changes$addedChange8, _search$body16, _search$body16$hits, _search$body16$hits$h, _search$body16$hits$h2, _changes$updatedChang5, _changes$updatedChang6, _changes$addedChange9, _changes$addedChange10, _changes$deletedChang9, _changes$deletedChang10;

    return _regeneratorRuntime__default['default'].wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            commitHash = _ref21.commitHash, parentTrail = _ref21.parentTrail;
            _context7.next = 3;
            return queryElasticseaerch({
              commitHashArray: [commitHash],
              client: this.client
            });

          case 3:
            search = _context7.sent;
            data = JSON.parse((_search$body$hits$hit6 = search === null || search === void 0 ? void 0 : (_search$body10 = search.body) === null || _search$body10 === void 0 ? void 0 : (_search$body10$hits = _search$body10.hits) === null || _search$body10$hits === void 0 ? void 0 : (_search$body10$hits$h = _search$body10$hits.hits) === null || _search$body10$hits$h === void 0 ? void 0 : (_search$body10$hits$h2 = _search$body10$hits$h[0]) === null || _search$body10$hits$h2 === void 0 ? void 0 : (_search$body10$hits$h3 = _search$body10$hits$h2._source) === null || _search$body10$hits$h3 === void 0 ? void 0 : _search$body10$hits$h3.change) !== null && _search$body$hits$hit6 !== void 0 ? _search$body$hits$hit6 : null);

            if (!data) {
              _context7.next = 33;
              break;
            }

            changes = getChanges({
              changed: data
            });
            result = {};

            if (!((search === null || search === void 0 ? void 0 : (_search$body11 = search.body) === null || _search$body11 === void 0 ? void 0 : (_search$body11$hits = _search$body11.hits) === null || _search$body11$hits === void 0 ? void 0 : (_search$body11$hits$h = _search$body11$hits.hits) === null || _search$body11$hits$h === void 0 ? void 0 : (_search$body11$hits$h2 = _search$body11$hits$h[0]) === null || _search$body11$hits$h2 === void 0 ? void 0 : (_search$body11$hits$h3 = _search$body11$hits$h2._source) === null || _search$body11$hits$h3 === void 0 ? void 0 : _search$body11$hits$h3.action) === "CREATE")) {
              _context7.next = 15;
              break;
            }

            _context7.next = 11;
            return this.databaseAddOneRowFunction({
              data: search === null || search === void 0 ? void 0 : (_search$body12 = search.body) === null || _search$body12 === void 0 ? void 0 : (_search$body12$hits = _search$body12.hits) === null || _search$body12$hits === void 0 ? void 0 : (_search$body12$hits$h = _search$body12$hits.hits) === null || _search$body12$hits$h === void 0 ? void 0 : (_search$body12$hits$h2 = _search$body12$hits$h[0]) === null || _search$body12$hits$h2 === void 0 ? void 0 : _search$body12$hits$h2._source,
              changedObj: (_changes$deletedChang7 = changes.deletedChange) === null || _changes$deletedChang7 === void 0 ? void 0 : _changes$deletedChang7.diff,
              flattedchanged: (_changes$deletedChang8 = changes.deletedChange) === null || _changes$deletedChang8 === void 0 ? void 0 : _changes$deletedChang8.change,
              auditTrail: true,
              parentTrail: parentTrail
            });

          case 11:
            result.added = _context7.sent;
            return _context7.abrupt("return", result);

          case 15:
            if (!((search === null || search === void 0 ? void 0 : (_search$body13 = search.body) === null || _search$body13 === void 0 ? void 0 : (_search$body13$hits = _search$body13.hits) === null || _search$body13$hits === void 0 ? void 0 : (_search$body13$hits$h = _search$body13$hits.hits) === null || _search$body13$hits$h === void 0 ? void 0 : (_search$body13$hits$h2 = _search$body13$hits$h[0]) === null || _search$body13$hits$h2 === void 0 ? void 0 : (_search$body13$hits$h3 = _search$body13$hits$h2._source) === null || _search$body13$hits$h3 === void 0 ? void 0 : _search$body13$hits$h3.action) === "DELETE")) {
              _context7.next = 22;
              break;
            }

            _context7.next = 18;
            return this.databaseDeleteOneRowFunction({
              data: search === null || search === void 0 ? void 0 : (_search$body14 = search.body) === null || _search$body14 === void 0 ? void 0 : (_search$body14$hits = _search$body14.hits) === null || _search$body14$hits === void 0 ? void 0 : (_search$body14$hits$h = _search$body14$hits.hits) === null || _search$body14$hits$h === void 0 ? void 0 : (_search$body14$hits$h2 = _search$body14$hits$h[0]) === null || _search$body14$hits$h2 === void 0 ? void 0 : _search$body14$hits$h2._source,
              changedObj: (_changes$addedChange7 = changes.addedChange) === null || _changes$addedChange7 === void 0 ? void 0 : _changes$addedChange7.diff,
              flattedchanged: (_changes$addedChange8 = changes.addedChange) === null || _changes$addedChange8 === void 0 ? void 0 : _changes$addedChange8.change,
              auditTrail: true,
              parentTrail: parentTrail
            });

          case 18:
            result.deleted = _context7.sent;
            return _context7.abrupt("return", result);

          case 22:
            if (!((search === null || search === void 0 ? void 0 : (_search$body15 = search.body) === null || _search$body15 === void 0 ? void 0 : (_search$body15$hits = _search$body15.hits) === null || _search$body15$hits === void 0 ? void 0 : (_search$body15$hits$h = _search$body15$hits.hits) === null || _search$body15$hits$h === void 0 ? void 0 : (_search$body15$hits$h2 = _search$body15$hits$h[0]) === null || _search$body15$hits$h2 === void 0 ? void 0 : (_search$body15$hits$h3 = _search$body15$hits$h2._source) === null || _search$body15$hits$h3 === void 0 ? void 0 : _search$body15$hits$h3.action) === "UPDATE")) {
              _context7.next = 27;
              break;
            }

            _context7.next = 25;
            return this.databaseUpdateOneRowFunction({
              data: search === null || search === void 0 ? void 0 : (_search$body16 = search.body) === null || _search$body16 === void 0 ? void 0 : (_search$body16$hits = _search$body16.hits) === null || _search$body16$hits === void 0 ? void 0 : (_search$body16$hits$h = _search$body16$hits.hits) === null || _search$body16$hits$h === void 0 ? void 0 : (_search$body16$hits$h2 = _search$body16$hits$h[0]) === null || _search$body16$hits$h2 === void 0 ? void 0 : _search$body16$hits$h2._source,
              changedObj: (_changes$updatedChang5 = changes.updatedChange) === null || _changes$updatedChang5 === void 0 ? void 0 : _changes$updatedChang5.diff,
              flattedchanged: (_changes$updatedChang6 = changes.updatedChange) === null || _changes$updatedChang6 === void 0 ? void 0 : _changes$updatedChang6.change,
              addChangedObj: (_changes$addedChange9 = changes.addedChange) === null || _changes$addedChange9 === void 0 ? void 0 : _changes$addedChange9.diff,
              addFlattedchanged: (_changes$addedChange10 = changes.addedChange) === null || _changes$addedChange10 === void 0 ? void 0 : _changes$addedChange10.change,
              deleteChangedObj: (_changes$deletedChang9 = changes.deletedChange) === null || _changes$deletedChang9 === void 0 ? void 0 : _changes$deletedChang9.diff,
              deleteFlattedchanged: (_changes$deletedChang10 = changes.deletedChange) === null || _changes$deletedChang10 === void 0 ? void 0 : _changes$deletedChang10.change,
              revert: false
            });

          case 25:
            result.updated = _context7.sent;
            return _context7.abrupt("return", result);

          case 27:
            _context7.next = 29;
            return this.databaseCustomFunction({
              action: (_search$body$hits$hit7 = search === null || search === void 0 ? void 0 : (_search$body17 = search.body) === null || _search$body17 === void 0 ? void 0 : (_search$body17$hits = _search$body17.hits) === null || _search$body17$hits === void 0 ? void 0 : (_search$body17$hits$h = _search$body17$hits.hits) === null || _search$body17$hits$h === void 0 ? void 0 : (_search$body17$hits$h2 = _search$body17$hits$h[0]) === null || _search$body17$hits$h2 === void 0 ? void 0 : (_search$body17$hits$h3 = _search$body17$hits$h2._source) === null || _search$body17$hits$h3 === void 0 ? void 0 : _search$body17$hits$h3.action) !== null && _search$body$hits$hit7 !== void 0 ? _search$body$hits$hit7 : "ERROR",
              data: search === null || search === void 0 ? void 0 : (_search$body18 = search.body) === null || _search$body18 === void 0 ? void 0 : (_search$body18$hits = _search$body18.hits) === null || _search$body18$hits === void 0 ? void 0 : (_search$body18$hits$h = _search$body18$hits.hits) === null || _search$body18$hits$h === void 0 ? void 0 : (_search$body18$hits$h2 = _search$body18$hits$h[0]) === null || _search$body18$hits$h2 === void 0 ? void 0 : _search$body18$hits$h2._source,
              changedObj: (_changes$updatedChang7 = changes.updatedChange) === null || _changes$updatedChang7 === void 0 ? void 0 : _changes$updatedChang7.diff,
              flattedchanged: (_changes$updatedChang8 = changes.updatedChange) === null || _changes$updatedChang8 === void 0 ? void 0 : _changes$updatedChang8.change,
              addChangedObj: (_changes$addedChange11 = changes.addedChange) === null || _changes$addedChange11 === void 0 ? void 0 : _changes$addedChange11.diff,
              addFlattedchanged: (_changes$addedChange12 = changes.addedChange) === null || _changes$addedChange12 === void 0 ? void 0 : _changes$addedChange12.change,
              deleteChangedObj: (_changes$deletedChang11 = changes.deletedChange) === null || _changes$deletedChang11 === void 0 ? void 0 : _changes$deletedChang11.diff,
              deleteFlattedchanged: (_changes$deletedChang12 = changes.deletedChange) === null || _changes$deletedChang12 === void 0 ? void 0 : _changes$deletedChang12.change,
              revert: false
            });

          case 29:
            result.updated = _context7.sent;
            return _context7.abrupt("return", result);

          case 33:
            return _context7.abrupt("return", null);

          case 34:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7, this);
  }));

  return function (_x10) {
    return _ref22.apply(this, arguments);
  };
}(); // add data into db


auditTrail.prototype.createData = /*#__PURE__*/function () {
  var _ref24 = _asyncToGenerator__default['default']( /*#__PURE__*/_regeneratorRuntime__default['default'].mark(function _callee8(_ref23) {
    var categoryId, userId, dataId, name, _ref23$before, before, after, parent, action, _ref23$ignore, ignore, otherArgs, indexName, change, i, diff, parentTrail, trailSession, hash, data, commitHash, insertdata;

    return _regeneratorRuntime__default['default'].wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            categoryId = _ref23.categoryId, userId = _ref23.userId, dataId = _ref23.dataId, name = _ref23.name, _ref23$before = _ref23.before, before = _ref23$before === void 0 ? {} : _ref23$before, after = _ref23.after, parent = _ref23.parent, action = _ref23.action, _ref23$ignore = _ref23.ignore, ignore = _ref23$ignore === void 0 ? [] : _ref23$ignore, otherArgs = _objectWithoutProperties__default['default'](_ref23, ["categoryId", "userId", "dataId", "name", "before", "after", "parent", "action", "ignore"]);
            indexName = this.indexName;

            if ((___default['default'].isEmpty(action) || !action) && action !== "") {
              // guess action type (use "" to exclude action)
              if (!before && after) {
                action = "CREATE";
              }

              if (before && after) {
                action = "UPDATE";
              }

              if (before && !after) {
                action = "DELETE";
              }
            }

            for (i = 0; i < ignore.length; i++) {
              delete before[ignore[i]];
              delete after[ignore[i]];
            }

            if (!___default['default'].isNull(after)) {
              diff = deepObjectDiff.detailedDiff(before, after);
              ignore === null || ignore === void 0 ? void 0 : ignore.forEach(function (key) {
                if (diff.added[key]) {
                  delete diff.added[key];
                }

                if (diff.deleted[key]) {
                  delete diff.deleted[key];
                }

                if (diff.updated[key]) {
                  delete diff.updated[key];
                }
              });
              change = JSON.stringify(diff);
            }

            if (___default['default'].isNull(parent) || ___default['default'].isUndefined(parent)) {
              parentTrail = uuid.v4();
            } else {
              trailSession = parent;
            }

            hash = crypto__default['default'].createHash('sha1');
            data = hash.update(JSON.stringify(_objectSpread$1(_objectSpread$1({}, change), {}, {
              time: Date.now()
            })), 'utf-8');
            commitHash = data.digest('hex');
            insertdata = _objectSpread$1(_objectSpread$1({
              categoryId: categoryId,
              userId: userId,
              dataId: dataId,
              name: name,
              parent: parent,
              action: action
            }, otherArgs), {}, {
              change: change,
              time: Date.now(),
              parentTrail: parentTrail,
              trailSession: trailSession,
              commitHash: commitHash
            });
            _context8.next = 12;
            return elasticsearchInsert({
              indexName: indexName,
              insertdata: insertdata,
              client: this.client
            });

          case 12:
            return _context8.abrupt("return", insertdata);

          case 13:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8, this);
  }));

  return function (_x11) {
    return _ref24.apply(this, arguments);
  };
}(); // modify commit map object


auditTrail.prototype.appendCommitMap = function (_ref25) {
  var _ref25$currentCommitM = _ref25.currentCommitMap,
      currentCommitMap = _ref25$currentCommitM === void 0 ? "{}" : _ref25$currentCommitM,
      _ref25$currentCommitH = _ref25.currentCommitHash,
      currentCommitHash = _ref25$currentCommitH === void 0 ? "" : _ref25$currentCommitH,
      _ref25$newCommitHash = _ref25.newCommitHash,
      newCommitHash = _ref25$newCommitHash === void 0 ? "" : _ref25$newCommitHash;
  var commitMap = yamlLikeStringParser({
    input: currentCommitMap
  });

  if (!currentCommitHash) {
    var _Object$keys3;

    if (((_Object$keys3 = Object.keys(commitMap)) === null || _Object$keys3 === void 0 ? void 0 : _Object$keys3.length) === 0) {
      // first commit
      commitMap[newCommitHash] = newCommitHash;
      return "{".concat(yamlLikeStringify({
        input: commitMap
      }), "}");
    } else {
      // new commit but haven't info
      console.log("Append Commit map error, no current commit hash but commit map is not empty!!!");
      return currentCommitMap;
    }
  } else {
    var _parseInt5, _currentCommitMap$mat, _currentCommitMap$mat2;

    if (!currentCommitMap) {
      console.log("Append Commit map error, no commit map is found!!!");
      return "{}";
    } // append


    var currentLevel = (_parseInt5 = parseInt((_currentCommitMap$mat = (_currentCommitMap$mat2 = currentCommitMap.match(new RegExp("\\^([0-9]+)_".concat(currentCommitHash)))) === null || _currentCommitMap$mat2 === void 0 ? void 0 : _currentCommitMap$mat2[1]) !== null && _currentCommitMap$mat !== void 0 ? _currentCommitMap$mat : 0, 10)) !== null && _parseInt5 !== void 0 ? _parseInt5 : 0;
    var currentIndex = currentCommitMap.indexOf("^".concat(currentLevel, "_").concat(currentCommitHash));
    var levelIndexArray = [currentIndex];

    for (var i = 0; i < currentLevel; i++) {
      levelIndexArray.push(getRightmostIndexBeforeEnd({
        input: currentCommitMap.substring(0, levelIndexArray[i]),
        searchText: "^".concat(currentLevel - 1 - i, "_"),
        end: levelIndexArray[i]
      }));
    }

    console.log("levelIndexArray", levelIndexArray);
    levelIndexArray = levelIndexArray.reverse();
    var path = [];

    for (var _i4 = 0; _i4 < levelIndexArray.length; _i4++) {
      var _i4$toString$length, _i4$toString, _substring$match$, _substring$match;

      var substring = currentCommitMap.substring(levelIndexArray[_i4], levelIndexArray[_i4] + 40 + 4 + ((_i4$toString$length = (_i4$toString = _i4.toString()) === null || _i4$toString === void 0 ? void 0 : _i4$toString.length) !== null && _i4$toString$length !== void 0 ? _i4$toString$length : 1) - 1);
      path.push((_substring$match$ = (_substring$match = substring.match("\\^".concat(_i4, "_(.*?):"))) === null || _substring$match === void 0 ? void 0 : _substring$match[1]) !== null && _substring$match$ !== void 0 ? _substring$match$ : 0);
    }

    var append = {};

    if (typeof ___default['default'].get(commitMap, path) !== "string") {
      append = _objectSpread$1({}, ___default['default'].get(commitMap, path));
    }

    append[newCommitHash] = newCommitHash;

    ___default['default'].set(commitMap, path, append);

    return "{".concat(yamlLikeStringify({
      input: commitMap
    }), "}");
  }
};

module.exports = auditTrail;
