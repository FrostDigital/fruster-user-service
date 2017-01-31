# Fruster User Service

Service for handling creation, fetching, updating and deletion of users and validation of users' passwords. 

## Exposed actions

### Create user 


Create a user. Fields `firstname`, `lastName`, `email` and `password` are required.
Roles are validated according to environment variable ROLE_SCOPES.
Password is validated according to regex in environment variable PASSWORD_VALIDATION_REGEX. 
Email is validated according to regex in environment variable EMAIL_VALIDATION_REGEX. 
See _Configuration_ in readme for default values. Fields `firstname`, `middleName`, `lastName` and `email` are saved as lowercase in the database. **NOTE:** The password is hashed using the user's unique salt and a pepper containing(**NOT** exlcusive to) the id of the user.

##### Subject
    
    user-service.create-user || http.post.admin.user-serv

Http subject requires admin.* scope.

##### Request 
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

##### Success response

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

##### Failure response
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


### Get user(s)
Get user(s) by provided query on all fields except those hidden in user service (E.g. password, salt and scopes). It is possible to mix match as many fields as you want. 

##### Subject
    
    user-service.get-user

##### Request 
    
	{
		//...
		data: 	{
		    //Query to get user(s)
			"firstName": "Viktor",
			"lastName": "Söderström"
		}
	}

##### Success response

	{
	  "status": 200,
	  "data": [{
	    "firstName": "Viktor",
	    "lastName": "Söderström",
	    "middleName": "Ludvig",
	    "email": "viktor1@frostdigital.se",
	    "roles": [
	      "admin"
	    ],
	    "id": "e4fa2690-88ec-4321-a3c7-483dd9fcaa6d",
	    "scopes": [
	      "profile.get",
	      "user.*"
	    ]
	  }],
	  "error": {},
	  "reqId": "0d406d40-6b84-11e6-b2ba-e989a238a846"
	}


_______________



### Get user by id
Get an user based on id.

##### Subject
    
	http.get.user.:userId

Requires admin.* scope.

##### Success response

	{
	  "status": 200,
	  "data": {
	    "firstName": "Hello",
	    "lastName": "Söderström",
	    "middleName": "Ludvig",
	    "email": "viktor1@frostdigital.se",
	    "roles": [
	      "admin"
	    ],
	    "id": "e4fa2690-88ec-4321-a3c7-483dd9fcaa6d",
	    "scopes": [
	      "profile.get",
	      "user.*"
	    ]
	  },
	  "error": {},
	  "reqId": "b4e2b3f0-6b84-11e6-b2ba-e989a238a846"
	}

##### Failure response

	{
	  "status": 404,
	  "data": {},
	  "error": {
	    "code": "user-service.404.1",
	    "title": "User not found",
	    "detail": "No user with id e4fa2690-88ec-4321-a3c7-483dd9fcaa6ds was found"
	  },
	  "reqId": "bbdd81d0-6b84-11e6-b2ba-e989a238a846"
	}


_______________

### Get users
Get all users.

##### Subject
    
	http.get.user
Requires admin.* scope.

##### Success response

	{
	  "status": 200,
	  "data": [
	    {
	      "firstName": "Roland",
	      "lastName": "Svensson",
	      "middleName": "Ludvig",
	      "email": "11633e10-d3ff-4104-8950-7d39e761ac44@frostdigxxital.se",
	      "roles": [
	        "admin"
	      ],
	      "id": "c9a4bfa6-fa6d-4631-b332-a7e99bc4e4ff",
	      "scopes": [
	        "profile.get",
	        "user.*"
	      ]
	    },
	    {
	      "firstName": "Viktor",
	      "lastName": "Söderström",
	      "middleName": "Ludvig",
	      "email": "d6eb44ba-0dc7-412a-9999-140e10a44b6a@frostdigxxital.se",
	      "roles": [
	        "admin"
	      ],
	      "id": "ffbcae50-8ccc-41f9-8f0a-841c7ff935e7",
	      "scopes": [
	        "profile.get",
	        "user.*"
	      ]
	    }
	  ],
	  "error": {},
	  "reqId": "df161400-6b84-11e6-b2ba-e989a238a846"
	}

_______________

### Get scopes for role
Return the scopes for requested role set in the configuration. 

##### Subject
    
	user-service.get-scopes

##### Success response
	{ 
		status: 200,
  		data: [ 'profile.get', 'user.*' ]
  	}

_______________

### Update user 
Fields `firstName`, `lastName`, `middleName` and `email` are possbile to update.

##### Subject
    
    user-service.update-user || http.put.user.:userId

Http subject requires admin.* scope.

#### Request 
    {
		//...
		data: 	{
			"id":"e4fa2690-88ec-4321-a3c7-483dd9fcaa6d" //Required only if used in service
		    "firstName":"Roland"
		}
	}

##### Success response

	{
	  "status": 200,
	  "data": {
	    "firstName": "Roland",
	    "lastName": "Söderström",
	    "middleName": "Ludvig",
	    "email": "viktor1@frostdigital.se",
	    "roles": [
	      "admin"
	    ],
	    "id": "e4fa2690-88ec-4321-a3c7-483dd9fcaa6d",
	    "scopes": [
	      "profile.get",
	      "user.*"
	    ]
	  },
	  "error": {},
	  "reqId": "ad3f1100-6b86-11e6-b2ba-e989a238a846"
	}

##### Failure response
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

### Delete user 
Delete user based on id.

##### Subject
    
    user-service.delete-user || http.delete.user.:userId

Http subject requires admin.* scope.


##### Success response

	{
	  "status": 200,
	  "data": {},
	  "error": {},
	  "reqId": "fff70980-6ba3-11e6-a49f-65fa27f53766"
	}

##### Failure response

	{
	  "status": 404,
	  "data": {},
	  "error": {
	    "code": "user-service.404.2",
	    "title": "User not found",
	    "detail": "No user with id cdc78c6a-8a31-48e3-9827-a5120b339524 was found"
	  },
	  "reqId": "04ab69d0-6ba4-11e6-a49f-65fa27f53766"
	}
_______________

### Validate password 
Validate an inputted password with registered password of user, typically when logging in or authorizing user.


##### Subject
    
    user-service.validate-password

##### Request 
    
	{
		//...
		data: 	{
		    "email":"viktor@frostdigital.se",
		    "password":"Localhost:8080"
		}
	}

##### Success response

	{
	  "status": 200,
	  "data": {},
	  "error": {},
	  "reqId": "d4614e70-6a9f-11e6-bd14-679d45e439c0"
	}

##### Failure response

	{
	  "status": 401,
	  "data": {},
	  "error": {
		"code" : "user-service.401.2"
	  },
	  "reqId": "dd0670f0-6a9f-11e6-bd14-679d45e439c0"
	}
_______________

### Update password 
Updates password of user. Requires user's old password to be validated before updated.

##### Subject
    
    user-service.update-password

##### Request 
    
	{
		//...
		data: 	{
		    "id":"a51b7531-41be-44a3-a6a1-664ffdc35e60",
		    "oldPassword":"bob",
		    "newPassword":"von"
		}
	}

##### Success response

	{
	  "status": 202,
	  "data": {},
	  "error": {},
	  "reqId": "d4614e70-6a9f-11e6-bd14-679d45e439c0"
	}

##### Failure response

	{
	  "status": 403,
	  "data": {},
	  "error": {
		"code" : "user-service.403.1"
	  },
	  "reqId": "dd0670f0-6a9f-11e6-bd14-679d45e439c0"
	}

_______________

### Set password 
Set password of user. Primarily used by password reset service to set password of user after a password reset is succesful.

##### Subject
    
    user-service.set-password

##### Request 
    
	{
		//...
		data: 	{
		    "id":"a51b7531-41be-44a3-a6a1-664ffdc35e60",
		    "newPassword":"Localhost:8081"
		}
	}

##### Success response

	{
	  "status": 202,
	  "data": {},
	  "error": {},
	  "reqId": "d4614e70-6a9f-11e6-bd14-679d45e439c0"
	}

##### Failure response

	{
	  "status": 404,
	  "error": {
	    "code": "user-service.404.1",
	    "id": "7d3e595d-df72-45a1-a96b-1ce96cc389e4",
	    "title": "User not found",
	    "detail": "User with id 932092a1-b2fb-4a61-9bdde9-096d1f3dadc2d was not found"
	  },
	  "reqId": "9d24c010-70e2-11e6-8f12-af9e23ee8aa7"
	}


_______________


### Add role(s)
Add roles to a user. Must be any of the predefined roles (Config ROLE_SCOPES). Accepts any number (above 0) of roles.

##### Subject
    
    user-service.add-roles


#### Request 
    {
		//...
		data: 	{
		    "id":"b5383008-76c8-4041-a474-a54210377766",
		   "roles":["super-admin", "user"]
		}
	}

##### Success response

	{
	  "status": 202,
	  "data": {},
	  "error": {},
	  "reqId": "741f5380-70f4-11e6-8e65-9f5683970205"
	}

##### Failure response
	{
	  "status": 404,
	  "error": {
	    "code": "user-service.404.1",
	    "id": "7d3e595d-df72-45a1-a96b-1ce96cc389e4",
	    "title": "User not found",
	    "detail": "User with id 932092a1-b2fb-4a61-9bdde9-096d1f3dadc2d was not found"
	  },
	  "reqId": "9d24c010-70e2-11e6-8f12-af9e23ee8aa7"
	}

_______________


### Remove role(s)
Remove roles from a user. Must be any of the predefined roles (Config ROLE_SCOPES). Accepts any number (above 0) of roles. Cannot remove all roles from user.

##### Subject
    
    user-service.remove-roles


#### Request 
    {
		//...
		data: 	{
		    "id":"b5383008-76c8-4041-a474-a54210377766",
		   "roles":["super-admin", "user"]
		}
	}

##### Success response

	{
	  "status": 202,
	  "data": {},
	  "error": {},
	  "reqId": "741f5380-70f4-11e6-8e65-9f5683970205"
	}

##### Failure response
	{
	  "status": 404,
	  "error": {
	    "code": "user-service.404.1",
	    "id": "7d3e595d-df72-45a1-a96b-1ce96cc389e4",
	    "title": "User not found",
	    "detail": "User with id 932092a1-b2fb-4a61-9bdde9-096d1f3dadc2d was not found"
	  },
	  "reqId": "9d24c010-70e2-11e6-8f12-af9e23ee8aa7"
	}

||

	{
	  "status": 400,
	  "error": {
	    "code": "user-service.400.14",
	    "id": "e73fa27a-532e-4637-8be3-442e3f9a83f6",
	    "title": "Cannot remove last role",
	    "detail": "User must have at least one role"
	  },
	  "reqId": "d7550fb0-7105-11e6-b8ca-89c1f45db148"
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

    ROLE_SCOPES = "super-admin:*;admin:profile.get,user.*;user:profile.get"

		# Checks for letters & numbers, an @ and a top domain
    EMAIL_VALIDATION_REGEX = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}
							{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.
							(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|
							name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}
							\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i

	# Checks for at least one uppercase letter, one lowercase letter and one digit, between 6 and 50 characters long
	PASSWORD_VALIDATION_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,50}$/
		
	# If user object is requried to have a password since this may not be needed when
	# using external auth, such as BankID
	REQUIRE_PASSWORD = true
	