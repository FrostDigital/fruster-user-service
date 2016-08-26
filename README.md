# Fruster User Service

Service for handling creation, fetching, updating and deletion of users and validation of users' passwords. 

## Exposed actions

### Create User 


Create a user. Fields `firstname`, `lastName`, `email` and `password` are required.
Roles are validated according to environment variable ROLE_SCOPES.
Password is validated according to regex in environment variable PASSWORD_VALIDATION_REGEX. 
Password is validated according to regex in environment variable EMAIL_VALIDATION_REGEX. 
See _Configuration_ in readme for default values.

#### Subject
    
    user-service.create-user || http.post.user-service

#### Request 
    {
		//...
		data: 	{
			"roles": ["ADMIN"],
			"firstName": "Viktor",
			"middleName": "Ludvig", 
			"lastName": "Söderström",
			"email": "viktors@frostdigital.se",
			"password": "Localhost:8080"
		}
	}

#### Success response

	{
	  "status": 201,
	  "data": {
	    "firstName": "Viktor",
	    "lastName": "Söderström",
	    "middleName": "Ludvig",
	    "email": "viktors@frostdigital.se",
	    "roles": [
	      "admin"
	    ],
	    "id": "401e2684-ff7a-4b06-aa39-846b77234f95",
	    "scopes": [
	      "profile.get",
	      "user.*"
	    ]
	  },
	  "error": {},
	  "reqId": "f4779960-6a9c-11e6-bd14-679d45e439c0"
	}

#### Failure response
Returns information about which field was incorrectly inputted. E.g. _"Email is not unique"_, _"firstName is required"_ or _"Invalid roles"_.

	{
	  "status": 400,
	  "data": {},
	  "error": {
	    "id": "e0578da3-3e14-4ca9-92fa-127c6643fdd9",
	    "title": "Email is not unique",
	    "detail": "Another account has already been registered with the provided email-address"
	  },
	  "reqId": "4d572580-6a9f-11e6-bd14-679d45e439c0"
	}


_______________


### Validate password 
Validate an inputted password with registered password of user, typically when logging in or authorizing user.


#### Subject
    
    user-service.validate-password

#### Request 
    
	{
		//...
		data: 	{
		    "email":"viktor@frostdigital.se",
		    "password":"Localhost:8080"
		}
	}

#### Success response

	{
	  "status": 200,
	  "data": {},
	  "error": {},
	  "reqId": "d4614e70-6a9f-11e6-bd14-679d45e439c0"
	}

#### Failure response

	{
	  "status": 401,
	  "data": {},
	  "error": {},
	  "reqId": "dd0670f0-6a9f-11e6-bd14-679d45e439c0"
	}

## Run

Install dependencies:

    npm install

Start server:

    npm start

## Configuration

Configuration is set with environment variables. All config defaults to values that makes sense for development.

    # NATS servers, set multiple if using cluster
    # Example: `"nats://10.23.45.1:4222,nats://10.23.41.8:4222"`
    BUS = "nats://localhost:4222"
    
    MONGO_URL = "mongodb://localhost:27017"

    ROLE_SCOPES = "admin:profile.get,user.*;user:profile.get"

	#Checks for letters & numbers, an @ and a top domain
    EMAIL_VALIDATION_REGEX = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}
							{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.
							(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|
							name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}
							\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i

	#Checks for at least one uppercase letter, one lowercase letter and one digit, between 6 and 50 characters long
	PASSWORD_VALIDATION_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,50}$/