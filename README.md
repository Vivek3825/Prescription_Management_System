# Prescription_Management_System

## 1. User authentication:-
```
	i.Login
	ii.Patient personal information (form):-
		1.Name
		2.Age
		3.Gender
		4.Weight
		5.Height
		6.Contact No.
		7.Email ID
		8.Medical Condition
		9.Calculate BMI (BMI = weight (kg) / (height (m))^2)
		(Arrange this info sequentially in order)
```

## 2. Prescription Management:- (Has two methods)
```
	i. Upload the prescription image or fill detail manualy
	ii. Also user can add new prescription image or detail in future
	iii. add option for upload image but we mainly focus on manual method)
```

## 3. Drug Information and interaction
```
	a. Harmful Interaction 
	b. Allergies 
	c. Contraindication 
	d. Side effects 
```
	
## 3. Dose tracking:- (Calender with different marks) 
```
	i. Missed
	ii. Taken 
	iii. Snooze
```
	
## 4. Refill Alerts:-
```
	i. Automatic notification –medication refill reminders 
```
	
## 5. Health tracking:- (after administration of drug )
```
	i. Symptoms
	ii. Side effects 
	iii. Vital signs 
```
	
## 6. Life style changes & diet Plans:-
```
	(information)
```

## 7. Technology info:
### Folder:-

###     Backed: Manage backend work
###     Fronted: Manage fontend work
###     Dataset: Manage all data

### Resource:-
```
	React, javascript, python3.12
```

### Dataset:- Manage all data, working localy.
```
	- authentication.csv to store user login info
	- info.csv to store user info
	- store prescription images inside Dataset/prescription_images/'User_name' folder
	- add Dataset/prescription_images/'User_name' path in info.csv
	- also store new prescriptions inside Dataset/prescription_images/'User_name'
	- User_name will the name of user + unique id to keep them separate
```

### Virtual Environment: 
```
	Create venv inside /home/bablu/Bablu/Works/Projects/Prescription_Management_System
```


### Random Dataset for testing project inside Dataset/
```
- random datasets that helps testing functions such as:
	Drug Information and interaction based on entred prescription
	Health tracking
- Store and generate unique IDs for
		medicine name, 
		medicine information, 
		Symptoms depend 
		Side effects 
		Vital signs
```

### A testing mechanism for Automatic notification – medication refill reminders 
```
- We can increase Decrease Day count manualy for testing
- also more based on requirement
```