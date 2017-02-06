// Routes

module.exports = function (app, requestpromise, hyperledger, socket, randomcolor) {

    app.get('/', function (req, res) {
        res.status(200).render('boilerplate.ejs', { 
            page: 'register',
            chain: hyperledger.stringToBase64(JSON.stringify(hyperledger.BLOCKCHAIN))
        });
    });

    app.get('/party/:id', function (req, res) {
        requestpromise(hyperledger.readAllParties())
            .then( function (data) {
                // Quick and dirty error handling. We cannot check for internal chaincode errors via the REST API.
                if ( manualErrorCheck(data) ) {
                    // At this moment we dont know for sure the add-data invoke was successful, we cant see internal errors.
                    if ( 'message' in data.result ) { // This is to avoid errors if there are no companies present.
                        var parties = JSON.parse(data.result.message);
                        var party = parties.filter(item => item.id === req.params.id)[0];
                        var candidates = parties.filter(item => !!item.candidate );
                        res.status(200).render('boilerplate.ejs', { 
                            page: 'party', 
                            party, 
                            candidates,
                            randomcolor,
                            chain: hyperledger.stringToBase64(JSON.stringify(hyperledger.BLOCKCHAIN))
                        });
                    }
                    
                }
                else {
                    res.status(500).json(data);
                }
            })
            .catch( function (error) {
                res.status(500).json(error);
            });
    });

    app.get('/facilitator', function (req, res) {
        res.status(200).render('boilerplate.ejs', { 
            page: 'facilitator',
            chain: hyperledger.stringToBase64(JSON.stringify(hyperledger.BLOCKCHAIN)) 
        });
    });

    app.get('/leaderboard', function (req, res) {
        requestpromise(hyperledger.readAllCandidates())
            .then( function (data) {
                // Quick and dirty error handling. We cannot check for internal chaincode errors via the REST API.
                if ( manualErrorCheck(data) ) {
                    // At this moment we dont know for sure the add-data invoke was successful, we cant see internal errors.
                    if ( 'message' in data.result ) { // This is to avoid errors if there are no companies present.
                        var candidates = JSON.parse(data.result.message);
                        res.status(200).render('boilerplate.ejs', { 
                            page: 'leaderboard',
                            candidates,
                            randomcolor, 
                            chain: hyperledger.stringToBase64(JSON.stringify(hyperledger.BLOCKCHAIN))
                        });
                    }
                }
                else {
                    res.status(500).json(data);
                }
            })
            .catch( function (error) {
                res.status(500).json(error);
            });
    });

    app.post('/api/party/create', function (req, res) {
        var { partyId, name, voter, candidate, candidateUrl } = req.body;
        // Send it to the hyperledger application.
        requestpromise(hyperledger.createParty(partyId, name, voter, candidate, candidateUrl))
            .then( function (data) {
                // Quick and dirty error handling. We cannot check for internal chaincode errors via the REST API.
                if ( manualErrorCheck(data) ) {
                    // At this moment we dont know for sure the add-data invoke was successful, we cant see internal errors.
                    // Send success as JSON
                    res.status(200).json( { 
                        'state': 'success'
                    });
                }
                else {
                    res.status(500).json(data);
                }
            })
            .catch( function (error) {
                res.status(500).json(error);
            });
    });

    app.get('/api/party/read', function (req, res) {
        requestpromise(hyperledger.readParty(req.query.id))
            .then( function (data) {
                if ( manualErrorCheck(data) ) {
                    var content = '';
                    if ( 'message' in data.result ) { // This is to avoid errors if there are no companies present.
                        content = JSON.parse(data.result.message);
                    }
                    res.status(200).json({ 'state':'success', 'data': content });
                }
                else {
                    res.status(500).json(data);
                }
            })
            .catch( function (error) {
                res.status(500).json(error);
            });
    });

    app.get('/api/party/readall', function (req, res) {
        requestpromise(hyperledger.readAllParties())
            .then( function (data) {
                if ( manualErrorCheck(data) ) {
                    var content = '';
                    if ( 'message' in data.result ) { // This is to avoid errors if there are no companies present.
                        content = JSON.parse(data.result.message);
                    }
                    res.status(200).json({ 'state':'success', 'data': content });
                }
                else {
                    res.status(500).json(data);
                }
            })
            .catch( function (error) {
                res.status(500).json(error);
            });
    });

    app.post('/api/party/update', function (req, res) {
        var { id, votesToAssign, votesTransferred, votesReceived } = req.body;
        requestpromise(hyperledger.updateParty(id, votesToAssign, votesTransferred, votesReceived))
            .then( function (data) {
                // Quick and dirty error handling. We cannot check for internal chaincode errors via the REST API.
                if ( manualErrorCheck(data) ) {
                    // At this moment we dont know for sure the add-data invoke was successful, we cant see internal errors.
                    // Send success as JSON
                    res.status(200).json( { 
                        'state': 'success'
                    });
                }
                else {
                    res.status(500).json(data);
                }
            })
            .catch( function (error) {
                res.status(500).json(error);
            });
    });

    app.post('/api/vote/createandassigntoall', function (req, res) {
        requestpromise(hyperledger.createVotesAndAssignToAll())
            .then( function (data) {
                // Quick and dirty error handling. We cannot check for internal chaincode errors via the REST API.
                if ( manualErrorCheck(data) ) {
                    // At this moment we dont know for sure the add-data invoke was successful, we cant see internal errors.
                    // Send success as JSON
                    res.status(200).json( { 
                        'state': 'success',
                        'data': data
                    });
                }
                else {
                    res.status(500).json(data);
                }
            })
            .catch( function (error) {
                res.status(500).json(error);
            });
    });

    // Full blockchain. - Also available in BLOCKCHAIN variable.
    app.get('/api/blockchain', function (req, res) {
        hyperledger.getFullBlockChain(requestpromise)
            .then( function (data) {
                console.log('\t=== UPDATING INTERNAL BLOCKCHAIN STATE.');
                hyperledger.BLOCKCHAIN = data;
                res.status(200).json(data);
            })
            .catch( function (err) {
                res.status(500).json(err);
            });
    });

}

function manualErrorCheck(dataObj) {
    if ( 'result' in dataObj && dataObj.result.status == 'OK' ) {
        return true;
    }
    return false;
}

// EOF
