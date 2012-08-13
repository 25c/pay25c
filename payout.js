var https = require('https');
var url = require('url');
var db = require('./db');

exports.pay = function(request, response, next) {
    var queryData = url.parse(request.url, true).query;

    //we need real auth for prod
    var client_id = queryData.client_id;
    if (!client_id) {
      response.writeHead(200, {'Content-Type': 'text/plain'});
      response.end('Missing client_id input param\n');
      console.log('Missing client_id input param\n');
      return;
    }
    var client = db.api_tokens[client_id];
    if(!client) {
      response.writeHead(200, {'Content-Type': 'text/plain'});
      response.end('Invalid client_id: ' + client_id +'\n');
      console.log('Invalid client_id: ' + client_id +'\n');
      return;
    }
    var req_token = queryData.token;
    if (!req_token) {
      response.writeHead(200, {'Content-Type': 'text/plain'});
      response.end('Missing token input param\n');
      console.log('Missing token input param\n');
      return;
    }
    if (req_token != client.token) {
      response.writeHead(200, {'Content-Type': 'text/plain'});
      response.end('Invalid tokent: ' + req_token +'\n');
      console.log('Invalid token: ' + req_token +'\n');
      return;
    }

    //TODO load the following from the props based on the env (i.e dev vs prod)
    var API_endpoint = "svcs.sandbox.paypal.com";   
    var API_user = 'gkozak_1273274236_biz_api1.gmail.com';
    var API_pass = '1273274257';
    var API_sig = 'APjDy-.QcBsfE3ygsmixpMtNiiTqAimPfWjtowcDebrj5XxKrpjfnLED';
    var senderEmail = 'gkozak_1273274236_biz@gmail.com';
    var cancelUrl = 'http://www.25c.com/payout/cancel';
    var returnUrl = 'http://www.25c.com/complete'; 

    var receiver = queryData.receiver;
    var amount = queryData.amount;
    var currency = queryData.currency;

    message='requestEnvelope.errorLanguage=en_US&actionType=PAY&senderEmail='+senderEmail+'&receiverList.receiver(0).email='+receiver+'&receiverList.receiver(0).amount='+amount+'&currencyCode='+currency+'&cancelUrl='+cancelUrl+'&returnUrl='+returnUrl;

    var req_options = {
        host: API_endpoint,
        method: 'POST',
        path: '/AdaptivePayments/Pay',
        headers: {
                'Host': API_endpoint,
                'Content-Type': 'application/x-www-form-urlencoded',
                //'Content-Type': 'text/namevalue',
                'Content-Length': message.length,
                'X-PAYPAL-REQUEST-DATA-FORMAT':'NV',
                'X-PAYPAL-RESPONSE-DATA-FORMAT':'NV',
                'X-PAYPAL-SECURITY-USERID':API_user,
                'X-PAYPAL-SECURITY-PASSWORD':API_pass,
                'X-PAYPAL-SECURITY-SIGNATURE':API_sig,
                'X-PAYPAL-APPLICATION-ID':'APP-80W284485P519543T'
            }
    }

    //in case we need to use the client side certificate
    //fs.readFile('/home/dev/.ssh/sandbox-paypal-private.pem', 'ascii', function(err, key){
    //   fs.readFile('/home/dev/.ssh/sandbox-paypal-public.pem', 'ascii', function(err, cert){
    //        req_options.key=key
    //        req_options.cert=cert
            var req = https.request(req_options, function(res){
                console.log('STATUS: ' + res.statusCode);
                console.log('HEADERS: ' + JSON.stringify(res.headers));
                res.on('data', function(d){
                    var pp_response = d.toString();
                    console.log(pp_response);
                    response.writeHead(200, {'Content-Type': 'text/plain'});
                    response.end(pp_response+'\n');
                });
            });
            req.write(message);
            req.end();

            req.on('error', function request_error(e) {
                console.log(e);
                response.writeHead(200, {'Content-Type': 'text/plain'});
                response.end(e+'\n');
            });
        //});
    //});
};
