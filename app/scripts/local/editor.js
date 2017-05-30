(function () {
  'use strict';
  //console.log('closure');

  // ---------------------
  // snackbar / toast
  // ---------------------
  function showNotification(data, type) {
    /*
    var data = {
      timeout: 5000,
      message: 'Message Sent',
      actionHandler: function(event) {},
      actionText: 'Undo'
    };
    */

    var $notification = $('.mdl-js-snackbar');
    $notification.alterClass('notif*', 'notif-' + type);

    var notificationEl = $notification[0];
    notificationEl.MaterialSnackbar.showSnackbar(data);
  }
  // ---------------------

  // ---------------------
  // simulator
  // ---------------------
  $('.simulate').on('click', function (e) {
    console.log('simulate clicked');
    e.preventDefault();
  });
  // ---------------------

  // ---------------------
  // data helpers
  // ---------------------
  $('.unittest-get-policies').on('click', function (e) {
    console.log('test get policies clicked');
    e.preventDefault();

    var options = {url: 'test-policies.json'};
    cui.ajax(options).then(function (data) {
      var realmName = 'realm: ' + data[0].realm;
      $('.realm-name').text(realmName);
      
      /*
      $('.policies-section').removeClass('hide');
      $('.simulator-section').find('.accordion-button').trigger('click');
      $('.simulator-section').removeClass('hide');
      */
      $('.policies-section').slideToggle();
      $('.simulator-section').find('.accordion-button').trigger('click');
      $('.simulator-section').slideToggle();

      _.each(data, function (policy) {
        injectNewRow(policy.id, policy.name[0].text, policy.description[0].text, policy.active);
        createListedPolicy(policy);
      });

      //showNotification({message: 'ok'}, SUCCESS);
      //showNotification({message: 'warning'}, WARN);
      //showNotification({message: 'failure'}, ERROR);
    });
  });

  $('.get-policies').on('click', function (e) {
    //cui.log('get policies clicked');
    e.preventDefault();

    if (getClientId().length && getClientSecret().length) {
      cui.log('getting token');
      CUIJS.setServiceUrl(getClientEnvironment());
      CUIJS.doSysAuth({
        clientId: getClientId(),
        clientSecret: getClientSecret()
      }).then(function () {
        cui.log('getting policies');
        CUIJS.getPolicies().then(function (data) {
          var realmName = 'realm: ' + data[0].realm;
          $('.realm-name').text(realmName);

          /*
          $('.policies-section').removeClass('hide');
          $('.simulator-section').find('.accordion-button').trigger('click');
          $('.simulator-section').removeClass('hide');
          */
          $('.policies-section').slideToggle();
          $('.simulator-section').find('.accordion-button').trigger('click');
          $('.simulator-section').slideToggle();

          _.each(data, function (policy) {
            injectNewRow(policy.id, policy.name[0].text, policy.description[0].text, policy.active);
            createListedPolicy(policy);
          });
        });
      }).fail(function (err) {
        var notifData = {
          message: CUIJS.parseError(err)
        };
        showNotification(notifData, ERROR);
      });
    }
  });
  // ---------------------

  // ---------------------
  // table helpers
  // ---------------------
  function injectNewRow(id, name, desc, active) {
    var input = $('<input></input>').addClass('mdl-checkbox__input').attr('id', id).attr('type', 'checkbox');
    var label = $('<label></label>').addClass('mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect mdl-data-table__select').attr('for', id);
    label.append(input);
    componentHandler.upgradeElement(label[0]);
    
    var col1 = $('<td></td>').append(label);
    var col2 = $('<td></td>').addClass('mdl-data-table__cell--non-numeric').text(name);
    var col3 = $('<td></td>').addClass('mdl-data-table__cell--non-numeric').text(desc);
    var col4 = $('<td></td>').addClass('mdl-data-table__cell--non-numeric').text(active);
    var row = $('<tr></tr>').append(col1).append(col2).append(col3).append(col4);
    //componentHandler.upgradeElement(row[0]);

    var rows = $('.policies-table tbody');
    rows.append(row);
  }

  function destroyRows() {
    $('.policies-table tbody tr').remove();
  }
  // ---------------------

  // ---------------------
  // table event handlers
  // ---------------------
  $('.policies-table tbody').on('change', ' .mdl-data-table__select input', function (e) {
    console.log('checkbox changed', $(this));
    e.preventDefault();

    var policyId = $(this).attr('id');
    if (e.target.checked) {
      var tabCount = $('.mdl-tabs__panel').length;
      if (tabCount < MAX_TABS) {
        // add to tabs
        //var name = getListedPolicy(policyId).name[0].text.substring(0, 8);
        var name = policyId.substring(0, 8);
        injectEditorAndForm(injectNewTab(name, policyId), policyId);
      } else {
        // revert check...
        $(this).parent()[0].MaterialCheckbox.uncheck();
        // TODO ? snackbar or toast message ...
      }
    } else {
      // remove from tabs
      destroyTab(policyId);
      destroyLoadedPolicy(policyId);
    }
  });

  /*$('.test-add-row').on('click', function () {
    injectNewRow('000000', 'name', 'desc', true);
  });*/
  // ---------------------

  // ---------------------
  // tab globals / helpers
  // ---------------------
  var MAX_TABS = 5;

  function getActivePanelId() {
    var id = '';
    var activeTabPanel = $('.mdl-tabs__panel.is-active');
    //console.log('getActivePanelId', activeTabPanel);
    if (activeTabPanel.length) {
      id = activeTabPanel.attr('id');
    }
    return id;
  }

  function injectNewTab(name, policyId) {
    var tabBar = $('.mdl-tabs__tab-bar');
    //var tabs = $('.mdl-tabs');
    var tabs = $('.tabs-panels');
    var container;

    var tabCount = $('.mdl-tabs__panel').length;
    //var tabNumber = tabCount;
    
    if (tabCount < MAX_TABS) {
      var close = $('<i></i>').addClass('close-tab material-icons').text('cancel');
      var bar = $('<a></a>').attr('href', '#panel-' + policyId).addClass('mdl-tabs__tab').text(name);
      bar.append(close);
      componentHandler.upgradeElement(bar[0]);
      tabBar.append(bar);

      var tab = $('<div></div>').attr('id', 'panel-' + policyId).addClass('mdl-tabs__panel');
      container = $('<div></div>').addClass('mdl-grid');
      tab.append(container);
      componentHandler.upgradeElement(tab[0]);
      tabs.append(tab);

      // make it active
      bar.trigger('click');

      $('.editor-section:hidden').slideToggle();
    }
    return container;
  }

  function destroyTab(policyId) {
    var policy = getLoadedPolicyByPolicy(policyId);
    //console.log('destroyTab', policyId, policy);

    var bar = $('[href="#' + policy.elementId + '"]');
    var panel = $('[id="' + policy.elementId + '"]');
    //console.log('destroyTab', policyId, bar, panel);

    if (panel.length && panel.length) {
      var selectAnother = bar.hasClass('is-active');

      bar.remove();
      panel.remove();

      if (selectAnother) {
        // click the first remaining...
        var another = $('.mdl-tabs__tab[href!="#' + policy.elementId + '"]').first();
        if (another.length) {
          // make it active
          //console.log('selectAnother', another);
          another.trigger('click');
        } else {
          //$('.editor-section').addClass('hide');
          $('.editor-section').slideToggle();
        }
      }
    }
  }
  // ---------------------

  // ---------------------
  // tab event handlers
  // ---------------------
  /*$('.add-tab-test').on('click', function () {
    console.log('att');
    injectEditorAndForm(injectNewTab());
  });*/

  // dynamically added tabs do not get click handling, so we'll add it ourselves...
  $('.mdl-tabs__tab-bar').on('click', '.mdl-tabs__tab', function (e) {
    console.log('tab click', $(this));
    e.preventDefault();

    $('.mdl-tabs__tab').removeClass('is-active');
    $(this).addClass('is-active');

    var elemId = $(this).attr('href');
    var tab = $(elemId);
    $('.mdl-tabs__panel').removeClass('is-active');
    tab.addClass('is-active');
  });

  $('.mdl-tabs__tab-bar').on('click', '.close-tab', function (e) {
    console.log('close-tab clicked', $(this));
    e.preventDefault();
    e.stopPropagation(); /* NB */

    var policyId = $(this).parent().attr('href').replace('#panel-', '');

    // remove from tabs
    destroyTab(policyId);
    destroyLoadedPolicy(policyId);

    // uncheck from list
    $('[id="' + policyId + '"]').parent()[0].MaterialCheckbox.uncheck();
  });
  // ---------------------


  // ---------------------
  // editor globals / helpers
  // ---------------------
  // NB this MUST be defined before editor instantiation, below
  var beautifying = false;
  var beautificationOptions = {
    indent_size: 2,
    indent_with_tabs: false
    /* these are defaults
    indent_size: 4,
    indent_char: ' ',
    indent_level: 0,
    preserve_newlines: true,
    max_preserve_newlines: 10,
    jslint_happy: false,
    space_after_anon_function: false,
    brace_style: collapse,
    keep_array_indentation: false,
    keep_function_indentation: false,
    space_before_conditional: true,
    break_chained_methods: false,
    eval_code: false,
    unescape_strings: false,
    wrap_line_length: 0
    */
  };

  var listedPolicies = [];
  var loadedPolicies = [];

  function getListedPolicy(polId) {
    //console.log('getLoadedPolicyByPolicy', loadedPolicies, polId);
    return _.find(listedPolicies, {id: polId});
  }

  function createListedPolicy(data) {
    listedPolicies.push(data);
  }

  function destoryListedPolicies() {
    listedPolicies = [];
  }

  function createLoadedPolicyObj(elementId, editorElement, formElement, policyId) {
    //var data = { script: 'ZnVuY3Rpb24gYXV0aG9yaXplKHN1YmplY3QsIHJlc291cmNlLCBlbnZBdHRyaWJ1dGVzKSB7DQoJICAgaWYoc3ViamVjdFsicGVyc29uLmlkIl0gPT0gcmVzb3VyY2VbInBlcnNvbi5pZCJdKQ0KCSAgICAgIHJldHVybiAiUEVSTUlUIjsNCgkgICByZXR1cm4gIkRFTlkiOw0KfQ=='};
    var data = getListedPolicy(policyId) || DATA_TEMPLATE;
    var obj = {
      policyId: policyId || '',
      elementId: elementId || '',
      form: policyFormEditor({ container: formElement, data: data, id: policyId }),
      editor: policyScriptEditor({ container: editorElement, content: atob(data.script) })
    };
    return obj;
  }

  function getLoadedPolicy(elemId) {
    //console.log('getLoadedPolicy', loadedPolicies, elemId);
    return _.find(loadedPolicies, {elementId: elemId});
  }

  function getLoadedPolicyByPolicy(polId) {
    //console.log('getLoadedPolicyByPolicy', loadedPolicies, polId);
    return _.find(loadedPolicies, {policyId: polId});
  }

  function destroyLoadedPolicy(polId) {
    //console.log('destroyLoadedPolicy', polId);
    loadedPolicies.splice(_.indexOf(loadedPolicies, _.find(loadedPolicies, {policyId: polId})), 1);
    //console.log('destroyLoadedPolicy', loadedPolicies);
  }
  // -----------------

  // -----------------
  // editor customizations
  // ---------------------
  // NB these MUST be defined before editor instantiation, below
  function beautify(editor) {
    beautifying = true;

    var session = editor.getSession();

    // Get current text from editor
    var val = session.getValue();

    // Remove leading spaces
    var array = val.split(/\n/);
    array[0] = array[0].trim();
    val = array.join('\n');

    // Beautify
    val = js_beautify(val, beautificationOptions);

    // Change current text to beautified text
    session.setValue(val);
    beautifying = false;
    console.log('beautified');
  }

  // NB also requires a HACK in ace src-override/ext-language_tools.js
  // to properly handle a dot as the popup trigger!
  var dynamicDotCompleter = {
    // Extend completer to have our custom flag
    dotCompleter: true,
    // Extend completer to allow [string]+[dot] as autocomplete trigger
    identifierRegexps: [/[a-zA-Z_0-9\.\$\-\u00A2-\uFFFF]/],
    // Define our dynamic getCompletions
    getCompletions: function (editor, session, pos, prefix, callback) {
      console.log('dynamicDotCompleter getCompletions', prefix, pos);

      if (prefix[prefix.length - 1] === '.') {
        //cui.log('there');
        getWordList(prefix).then(function (wordListObj) {
          console.log('now', wordListObj);
          callback(null, wordListObj.words.map(function (word) {
            //cui.log('everywhere');
            return {
              caption: word,
              value: word,
              score: 1000,
              meta: wordListObj.meta
            };
          }));
        });
      }
    }
  };

  function getWordList(prefix) {
    var deferred = $.Deferred();
    var wordListObj = { meta: '', words: [] };

    switch (prefix) {
      /*case 'specialWord.':
              return someAsyncCall('triggers').then(function(triggers) {
                      return otherAsyncCall('events');
                  })
                  .then(function(eventTemplates) {
                      angular.forEach(eventTemplates, function(eventTemplate) {
                          angular.forEach(eventTemplate.eventFields, function(eventField) {
                              cui.log('pushed word', eventField.name);
                              wordListObj.words.push(eventField.name);
                          });
                      });
                      //deferred.resolve(wordListObj);
                      return wordListObj;
                  });
          }
          break;*/

      default:
        wordListObj = { meta: 'test', words: ['one', 'two', 'three'] };
        return deferred.resolve(wordListObj);
        break;
    }

    return deferred;
  }
  // ---------------------


  // ---------------------
  // form instantiation
  // ---------------------
  var DEFAULT_SCRIPT = 'function authorize(subject, resource, envAttributes) {return "DENY";}';
  var DATA_TEMPLATE = {
    id: '0',
    version: '',
    creator: 'POLENTED',
    creatorAppId: 'POLENTED',
    creation: 1463594484417,
    realm: '',
    name: [
      {
        lang: 'en_us',
        text: ''
      }
    ],
    description: [
      {
        lang: 'en_us',
        text: ''
      }
    ],
    active: true,
    actions: [],
    subjects: [],
    resourceTypes: [],
    script: ''
  };

  var FORM_TEMPLATE = '' +
    '<form class="policy-form mdl-grid" action="#">' +
      '<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label mdl-cell mdl-cell--12-col">' +
        '<label class="mdl-textfield__label" for="pid">Policy Id</label>' +
        '<input disabled class="mdl-textfield__input" type="text" id="pid">' +
      '</div>' +
      '<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label mdl-cell mdl-cell--12-col">' +
        '<label class="mdl-textfield__label" for="pname">Name</label>' +
        '<input class="mdl-textfield__input" type="text" id="pname">' +
      '</div>' +
      '<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label mdl-cell mdl-cell--12-col">' +
        '<label class="mdl-textfield__label" for="pdesc">Desc</label>' +
        '<input class="mdl-textfield__input" type="text" id="pdesc">' +
      '</div>' +
      '<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label mdl-cell mdl-cell--12-col">' +
        '<label class="mdl-textfield__label" for="pactive">Active</label>' +
        '<input class="mdl-textfield__input" type="text" id="pactive">' +
      '</div>' +
      '<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label mdl-cell mdl-cell--12-col">' +
        '<label class="mdl-textfield__label" for="psubjects">Subjects</label>' +
        '<input class="mdl-textfield__input" type="text" id="psubjects">' +
      '</div>' +
      '<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label mdl-cell mdl-cell--12-col">' +
        '<label class="mdl-textfield__label" for="pactions">Actions</label>' +
        '<input class="mdl-textfield__input" type="text" id="pactions">' +
      '</div>' +
      '<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label mdl-cell mdl-cell--12-col">' +
        '<label class="mdl-textfield__label" for="presources">Resource Types</label>' +
        '<input class="mdl-textfield__input" type="text" id="presources">' +
      '</div>' +
    '</form>';

  var policyFormEditor = function (options) {
    if (!options) {
      options = {};
    }

    var data = options.data || DATA_TEMPLATE;
    var container = options.container || '';
    var uniqueId = options.id || '';

    /*var reducedData = _.cloneDeep(data);
    delete reducedData.script;
    delete reducedData.version;
    delete reducedData.creator;
    delete reducedData.creatorAppId;
    delete reducedData.creation;
    delete reducedData.realm;
    var content = JSON.stringify(reducedData);*/

    var content = $(FORM_TEMPLATE).clone();
    content.find('#pid').val(data.id);
    content.find('#pname').val(data.name[0].text);
    content.find('#pdesc').val(data.description[0].text);
    content.find('#pactive').val(data.active);
    content.find('#psubjects').val(JSON.stringify(data.subjects));
    content.find('#pactions').val(JSON.stringify(data.actions));
    content.find('#presources').val(JSON.stringify(data.resourceTypes));

    $(content).find('div').each(function () {
      var $el = $(this);
      var input = $el.find('input');
      var label = $el.find('label');

      input.attr('id', input.attr('id') + '-' + uniqueId);
      label.attr('for', label.attr('for') + '-' + uniqueId);
      //componentHandler.upgradeElement(input[0]);
      //componentHandler.upgradeElement(label[0]);

      var el = $(this)[0];
      //cui.log('each', index, $el, el)
      componentHandler.upgradeElement(el);
    });

    $(container).append(content);
    //componentHandler.upgradeElement(content[0]);

    return $(container);
  };
  // ---------------------


  // ---------------------
  // editor instantiation
  // ---------------------
  var policyScriptEditor = function (options) {
    if (!options) {
      options = {};
    }

    var content = options.content || DEFAULT_SCRIPT;
    var container = options.container || 'editor';

    var editor = ace.edit(container);
    console.log('aceLoaded', editor);

    var session = editor.getSession();

    // var _renderer = editor.renderer;
    var langTools = ace.require('ace/ext/language_tools');
    langTools.addCompleter(dynamicDotCompleter);
    console.log('langTools', langTools);

    editor.setOptions({
      showGutter: true,
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true
        //enableSnippets: true
    });
    editor.setTheme('ace/theme/monokai');
    // Mute deprecation warning
    editor.$blockScrolling = Infinity;

    session.setMode('ace/mode/javascript');
    session.setUseWrapMode(true);
    session.setUseSoftTabs(!beautificationOptions.indent_with_tabs);
    session.setTabSize(beautificationOptions.indent_size);
    session.setUndoManager(new ace.UndoManager());


    // Events
    session.on('change', function (e) {
      console.log('session doc changed', e);
      // beautify on initial load of code into editor,
      // and do not infinitely loop while trying!
      if (safeToBeautify(e)) {
        beautify(editor);
      }
    });

    session.setValue(content);

    return editor;
  };
  // -----------------

  // ---------------------
  // editor event handling
  // ---------------------
  function safeToBeautify(e) {
    if (!beautifying && e.action === 'insert' && e.start.row === 0 && e.start.column === 0) {
      return true;
    } else {
      return false;
    }
  }

  function injectEditorAndForm(parent, policyId) {
    if (parent) {
      var formContainer = $('<div></div>').addClass('form-container mdl-cell mdl-cell--5-col');
      parent.append(formContainer);

      var editorContainer = $('<div></div>').addClass('editor-container mdl-cell mdl-cell--7-col');
      parent.append(editorContainer);

      //var number = parent.parent().attr('id').replace('panel-', '');
      var parentElementId = parent.parent().attr('id');

      loadedPolicies.push(createLoadedPolicyObj(parentElementId, editorContainer[0], formContainer[0], policyId));
    }
  }

  $('#beautify').on('click', function () {
    console.log('beautify clicked');

    var editor = getLoadedPolicy(getActivePanelId()).editor;
    beautify(editor);
  });
  
  $('#undo').on('click', function () {
    console.log('undo clicked');
    var editor = getLoadedPolicy(getActivePanelId()).editor;

    var um = editor.getSession().getUndoManager();
    um.undo();
  });
  
  $('#redo').on('click', function () {
    console.log('redo clicked');
    var editor = getLoadedPolicy(getActivePanelId()).editor;

    var um = editor.getSession().getUndoManager();
    um.redo();
  });

  $('#add').on('click', function () {
    console.log('add clicked');

    var tabCount = $('.mdl-tabs__panel').length;
    if (tabCount < MAX_TABS) {
      // add 'new' to tabs
      var name = 'new';
      var policyId = getRandomInt(0, 100).toString();
      injectEditorAndForm(injectNewTab(name, policyId), policyId);
    } else {
      // TODO ? snackbar or toast message ...
    }
  });
  // -----------------


  // -----------------
  // Util
  // -----------------
  var getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  // -----------------


  // -----------------
  // INIT
  // -----------------
  var ERROR = 'error';
  var WARN = 'warn';
  var SUCCESS = 'success';

  var getClientId = function () {
    return $('#cid').val();
  };
  var getClientSecret = function () {
    return $('#csecret').val();
  };
  var getClientEnvironment = function () {
    return $('#cenv').val();
  };

  var CUIJS;
  var cuijsCalls = [
    // Policy calls
    {cmd: 'getPolicies', call: '/authz/v1/authorizationPolicies', type: 'GET', accepts: 'application/vnd.com.covisint.platform.authorization.policy.v1+json'}
  ];

  $(document).ready(function () {
    cui.enableLog();

    cui.apiAsync({
      //serviceUrl: 'STG',
      retryUnsecured: false,
      defs: [
        'https://cuijs.run.covisintrnd.com/defs/idm.json',
        cuijsCalls
      ]
    }).then(function(obj) {
      //cui.log('CUIJS ready', obj);
      CUIJS = obj;
      cui.log('cui.js v', CUIJS.version());
    });
  });
  // -----------------

})();

// ------------------------------

