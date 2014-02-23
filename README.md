#SMS Voting 2

===

* This is a Real-Time SMS Voting System. This system was used during the singing competition hosted by University of Waterloo Chinese Student and Scholar Association. 
* Since I only had a bit more than 1 week to make everything works, there are many flaws in the system. However, I did my best to make the system flexible and easy to maintain.
* The system can collect realtime voting from audiences(In this case, since we decided to use Nexmo, the Twilio parser might not work as expected.) and compile a statistics when client-side(which is also a HTML page) asks for it via AJAX.
* The system can be controlled by a backend control panel via REST APIs.

app.js is the main entry of the backend server. 

```
/panel contains backend control panel. It was written in HTML 5 and Bootstrap Framework.
```

```
/verifyNumber contains a simple webpage that allows audiences to check if their phone number if successfully registered. We don't want to send a message back to user, because it seems Nexmo sometime cannot deliver messages back to users. And I'd rather had no feedback than false feedbacks.
```

Backend of the system, including control panel and 'verifyNumber' was developed by Collin Zhang.
