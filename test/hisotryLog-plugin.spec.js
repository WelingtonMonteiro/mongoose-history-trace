'use strict';

const HistoryLog = require('lib/historyLog-plugin');
const HistoryLogModel = require('lib/historyLog-model');
const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');

describe('HistoryLog Plugin Tests', () => {

  const otherConnection = mongoose.createConnection('mongodb://localhost/historyLogsTest');
  const defaultConnection = mongoose.createConnection('mongodb://localhost/test');

  const HistoryLogTestDefinition = {
    ts: Number,
    value: String
  };
  const HistoryLogTestSchema = new mongoose.Schema(HistoryLogTestDefinition);
  HistoryLogTestSchema.plugin(HistoryLog);
  const HistoryLogTest = mongoose.model('HistoryLogTest', HistoryLogTestSchema);

  before(async () => {
    const mongoose = require('mongoose');
    await mongoose.connect(defaultConnection);
  });


  it('HistoryLog Create', function (done) {
    const auditTest = new HistoryLogTest({ts: TS});
    auditTest.save(function (err, doc) {
      if (err) {
        return done(err);
      }
      doc.should.have.property('_createdAt');
      doc._createdAt.should.eql(doc._updatedAt);
      HistoryLogTest.getHistoryLog().findOne({'location': 'audittests', 'document.ts': TS}, function (err, audit) {
        audit.operation.should.eql('create');
        done(err);
      });
    });
  });

  it('HistoryLog Update with no changes', function (done) {
    HistoryLogTest.findOne({ts: TS}, function (err, doc) {
      if (err) {
        return done(err);
      }
      doc.save(function (err, doc) {
        if (err) {
          return done(err);
        }
        doc._createdAt.should.eql(doc._updatedAt);
        // This operation should not include an entry in the history log
        HistoryLogTest.getHistoryLog().count({'location': 'audittests', 'document.ts': TS}, function (err, c) {
          c.should.eql(1);
          done(err);
        });
      });
    });
  });

  it('HistoryLog Update', function (done) {
    HistoryLogTest.findOne({ts: TS}, function (err, doc) {
      if (err) {
        return done(err);
      }
      setTimeout(function () {
        doc.value = 'foo';
        doc._user = 'cesar';
        doc.save(function (err, doc) {
          doc._updatedAt.should.be.above(doc._createdAt);
          doc.should.have.property('_user');
          HistoryLogTest.getHistoryLog().findOne({
            'location': 'audittests',
            'document.ts': TS,
            'operation': 'update'
          }, function (err, audit) {
            audit.user.should.eql('cesar');
            done(err);
          });
        });
      }, 50);
    });
  });


  it('HistoryLog Delete', function (done) {
    // IMPORTANT!!!!! We cannot use the HistoryLogTest.remove() operation as it does not work with documents
    HistoryLogTest.findOne({ts: TS}, function (err, doc) {
      if (err) {
        return done(err);
      }
      doc.remove(function (err) {
        if (err) {
          return done(err);
        }
        HistoryLogTest.getHistoryLog().findOne({
          'location': 'audittests',
          'document.ts': TS,
          'operation': 'delete'
        }, function (err) {
          done(err);
        });
      });
    });
  });

  it('HistoryLog Use a different connection', function (done) {
    if (otherConnection.readyState === 1) {
      const SecondHistoryLogTestSchema = new mongoose.Schema(HistoryLogTestDefinition);
      SecondHistoryLogTestSchema.plugin(HistoryLog);
      // TODO - If we change SecondHistoryLogTestSchema by HistoryLogTestSchema in the next line with actual implementation
      //        we are retrieving the first connection instead the second, so the autitlog will be created in
      //        test database instead of audit-test one.
      const SecondHistoryLogTest = otherConnection.model('SecondHistoryLogTest', SecondHistoryLogTestSchema);
      const auditTest = new SecondHistoryLogTest({ts: TS});
      auditTest.save(function (err, doc) {
        if (err) {
          return done(err);
        }
        doc.should.have.property('_createdAt');
        doc._createdAt.should.eql(doc._updatedAt);
        SecondHistoryLogTest.getHistoryLog().findOne({
          'location': 'secondaudittests',
          'document.ts': TS
        }, function (err, audit) {
          audit.operation.should.eql('create');
          done(err);
        });
      });
    } else {
      // TODO - improve this. The following did not work:
      // secondConnection.on('connected', function() {})
      done(new Error('Second connection is not ready'));
    }
  });

  it('HistoryLog an Model operation', function (done) {
    const ts = moment().valueOf();
    const auditTest = new HistoryLogTest({ts: ts});
    auditTest.save(function (err, doc) {
      HistoryLogTest.findByIdAndRemove(doc._id, function (err, doc) {
        HistoryLogTest.logChange(doc, 'delete', ts, function (err) {
          if (err) {
            return done(err);
          }

          HistoryLogTest.getHistoryLog().findOne({
            'location': 'audittests',
            'document.ts': ts,
            'operation': 'delete'
          }, function (err) {
            done(err);
          });
        });
      });
    });
  });

  it('HistoryLog a bulk delete operation', function (done) {
    const ts = moment().valueOf();
    const selector = {ts: ts};
    const auditTest = new HistoryLogTest(selector);
    auditTest.save(function (err) {
      HistoryLogTest.remove(selector, function (err, num) {
        HistoryLogTest.logBulkDelete(selector, function (err) {
          if (err) {
            return done(err);
          }
          HistoryLogTest.getHistoryLog().findOne({
            'location': 'audittests',
            'selector': selector,
            'operation': 'delete'
          }, function (err, audit) {
            done(err);
          });
        });
      });
    });
  });

  it('HistoryLog a bulk update operation', function (done) {
    const ts = moment().valueOf();
    const selector = {ts: ts};
    const auditTest = new HistoryLogTest(selector);
    const update = {'$set': {value: 'foo'}};
    auditTest.save(function (err) {
      HistoryLogTest.update(selector, update, function (err, num) {
        HistoryLogTest.logBulkUpdate(selector, update, function (err) {
          if (err) {
            return done(err);
          }
          HistoryLogTest.getHistoryLog().findOne({
            'location': 'audittests',
            'selector': selector,
            'operation': 'update'
          }, function (err, audit) {
            // TODO note the change in the update operation. We had to do this way as there is a bug in the mongodb driver we are using
            // related to bson. The driver it is not able to store a key starging with '$'
            audit.document.should.eql({'set': {value: 'foo'}});
            done(err);
          });
        });
      });
    });
  });


});
