import React from 'react';
import ReactDOM from 'react-dom';
import { ajax } from 'jquery';
import {
  BrowserRouter as Router,
  NavLink as Link,
  Route,
  withRouter
} from 'react-router-dom';


//import the firebase database information from google firebase
  // Initialize Firebase
var config = {
  apiKey: "AIzaSyAzHzj_zAsE1O16JxEa3AS9yzrm9OotnWE",
  authDomain: "pawprints-2becd.firebaseapp.com",
  databaseURL: "https://pawprints-2becd.firebaseio.com",
  projectId: "pawprints-2becd",
  storageBucket: "pawprints-2becd.appspot.com",
  messagingSenderId: "721810348265"
};
firebase.initializeApp(config);

const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
const dbRef = firebase.database().ref('/');


//part of database specific to missing pets
//all missing pets will dynamically be entered into this section of the database
const missingPetsDbRef = firebase.database().ref('/missing-pets')


//homepage component
class Home extends React.Component {
  render () {
    return (
        <div className="homePage wrapper">
            <p className="homePage__login wrapper">Welcome To</p><h1 className="homePage__header wrapper">PawPrints</h1>
            <p className="homePage__login wrapper">Login to create a new pet profile!</p>
        </div>
    )   
  }
}

class About extends React.Component {
  render () {
    return (
        <div className ="aboutPage wrapper">
            <h1 className="aboutPage__header">About Us</h1>
            <p className="aboutPage__information">Pawprints is an application built, and dedicated, to our furriest of friends and keeping them safe. The central purpose of PawPrints is to connect owners of missing pets and the community around them.</p>
            <p className="aboutPage__information">We understand how much your pet means to you. PawPrints allows an immediate, easy, and direct way to post missing pet ads, contact information and rewards.</p>
            <p className="aboutPage__information">Built with <i className="fa fa-heart" aria-hidden="true"></i> by Christopher Comper</p>
            <p className="aboutPage__links">
                <a href="https://twitter.com/chriscomper">
                    <i className="fa fa-twitter"></i>
                </a>
                <a href="https://github.com/ccomper">
                    <i className="fa fa-github"></i>
                </a>
                <a href="https://www.linkedin.com/in/chris-comper-07bb6a13b/">
                    <i className="fa fa-linkedin-square"></i>
                </a>
            </p>
        </div>
    )
  }
}
//Profile requires login auth
//The profile page will have details about your specific pets Profile
//it will use the individual pet component and set state of that component
class Profile extends React.Component {
    constructor() {
    super();
    this.state = {
        userPets: [],
        petName: '',
        petDescription: '',
        petContact: '',
        petLastSeen: '',
        petReward: '',
        petImage: [],
        loading: false
    }   
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.removePet = this.removePet.bind(this);
    this.addMissingPet = this.addMissingPet.bind(this);
    this.uploadPetImage = this.uploadPetImage.bind(this);
  }
  handleSubmit (e) {
        e.preventDefault();
        const userId = this.state.user.uid;
        const userRef = firebase.database().ref(userId);
        //push current state into db and reset state
        const { petName, petDescription, petContact, petLastSeen, petReward, petImage, fileName } = this.state;
        userRef.push({ petName, petDescription, petContact, petLastSeen, petReward, petImage, fileName });
        this.setState ({
            petName: '',
            petDescription: '',
            petContact: '',
            petLastSeen: '',
            petReward: '',
            petImage: [],
            loading: false
        });
    }
  handleChange (e) {
        this.setState({
            [e.target.name]: e.target.value 
        });
    }
  removePet (petKey, photoUrl) {
    //target information associated with each pet and remove
    const userId = this.state.user.uid;
    const userRef = firebase.database().ref(`${userId}/${petKey}`);
    userRef.remove();
    //target pet image and remove it from storage
    const userPhoto = firebase.storage().refFromURL(photoUrl);
    userPhoto.delete();
    //target pet from missing pets db and remove it
    let newMissingPetsArray = Array.from(this.state.missingPetsArray);
    newMissingPetsArray = newMissingPetsArray.filter((pet) => {
      console.log('pet.key', pet.key);
      return pet.key !== petKey
    });
    missingPetsDbRef.set(newMissingPetsArray);
  }
  addMissingPet (pet) {
    //push data of missing pet into the missingPet database location
    missingPetsDbRef.push(pet);
    console.log(missingPetsDbRef);
}
  uploadPetImage (e) {
    let file = e.target.files[0];
    const userId = this.state.user.uid;

    //store images at the location of the userId so each pet image is specific to user pet
    if (file.size < 2048576) {
      const storageRef = firebase.storage().ref(`profile-images/${userId}/` + file.name)
      this.setState ({
        loading: true
      })
      const task = storageRef.put(file).then( () => {
          const urlObject = storageRef.getDownloadURL().then( (data) => {
              this.setState ({petImage: data, fileName: file.name, loading: false })
          })
      });
    } else {
      alert('File size is too big!')
    }
  }
  render () {
    return (
        <div className="profile-page wrapper">
            <h1 className="profile-page__header wrapper">Profile Page</h1>
            <div className="profile-page__entireForm">
                <h2 className="profile-page__header wrapper">Input Pet Information!</h2>
                <form className="profile-page__form wrapper" onSubmit={this.handleSubmit}>
                    <input name="petName" value={this.state.petName} onChange={this.handleChange} type="text" placeholder="Enter your pets name!" />
                    <input name="petDescription" value={this.state.petDescription} onChange={this.handleChange} type="text" placeholder="Enter a description of your pet" />
                    <input name="petContact" value={this.state.petContact} onChange={this.handleChange} type="text" placeholder="Enter your contact information" />
                    <input name="petLastSeen" value={this.state.petLastSeen} onChange={this.handleChange} type="text" placeholder="Last location the pet was seen (intersection)" />
                    <input name="petReward" value={this.state.petReward} onChange={this.handleChange} type="text" placeholder="Enter a reward if pet is found" />
                    <input className="profile-page__uploadInput" name="petImage" type="file" onChange={this.uploadPetImage} />
                    {this.state.loading ?
                      null
                      :
                      <div>
                         <input className="submitButton" type="submit" value="Add Pet To Profile"/>
                      </div>
                    }
                </form>
            </div>
            <h2 className="profile-page__listHeader wrapper">Your Pets Below!</h2>
            <ul className="profile-page__petList wrapper">
             {this.state.userPets.map( (pet) => {
                            return (<li className="profile-page__listItem" key={pet.key}>
                                <img src={pet.pet.petImage} />
                                <p className="profile-page__listItemProp">Name:</p><p> {pet.pet.petName}</p>
                                <p className="profile-page__listItemProp">Description:</p><p> {pet.pet.petDescription}</p> 
                                <p className="profile-page__listItemProp">Contact:</p><p> {pet.pet.petContact}</p> 
                                <p className="profile-page__listItemProp">Area last seen:</p><p> {pet.pet.petLastSeen}</p> 
                                <p className="profile-page__listItemProp">Reward if found:</p><p> {pet.pet.petReward}</p> 
                                <button className="profile-page__button" onClick={() => this.removePet(pet.key, pet.pet.petImage)}>Remove Pet</button>
                                <Link to="/missing-pets">
                                  <button className="profile-page__button" onClick={() => this.addMissingPet(pet)}>Pet is missing!</button>
                                </Link>
                            </li>)
                })}
            </ul> 
        </div>
    )
  }
  componentDidMount () {
    //check to see if the user is logged in
    missingPetsDbRef.on('value', (snapshot) => {
      const missingPets = snapshot.val();
      const missingPetsArray = [];
      for (let key in missingPets) {
        missingPetsArray.push(missingPets[key]);
      }
      this.setState({
        missingPetsArray
      });
    });
    auth.onAuthStateChanged ( (user) => {
        if (user) {
            this.setState({
                user: user,
                loggedIn: true
            });
            //if logged in, update the firebase
            const userId = this.state.user.uid;
            const userRef = firebase.database().ref(userId);
            userRef.on('value', (snapshot) => {
                const userPets = snapshot.val();
                const petsArray = [];
                for (let key in userPets) {
                    const newPet = {
                        key: key,
                        pet: userPets[key]
                    }
                    petsArray.push(newPet);
                }
                this.setState({
                    userPets: petsArray
                })
            })
        } else {
            //redirect to the home page
        }
    });
  }
}
//missing pets page
//will have list of all missing pets, last location seen, a link to the profile,
//reward and contact info
class MissingPets extends React.Component {
  constructor() {
    super();
    this.state = {
      missingPets: []
    };
  }
  render () {
    return (
        <div className="missing-page wrapper">
          <h1 className="missing-page__header wrapper">Missing Pets</h1> 
            <ul className="missing-page__petList">
             {this.state.missingPets.map( (pet) => {
                            return (<li className="missing-page__petListItem">
                                <img src={pet.pet.petImage} />
                                <p className="missing-page__petItem">Name:</p><p>{pet.pet.petName}</p>
                                <p className="missing-page__petItem">Description:</p><p> {pet.pet.petDescription}</p>
                                <p className="missing-page__petItem">Contact:</p><p> {pet.pet.petContact}</p> 
                                <p className="missing-page__petItem">Area last seen:</p><p> {pet.pet.petLastSeen}</p> 
                                <p className="missing-page__petItem">Reward if found:</p><p> {pet.pet.petReward}</p>  
                            </li>)
                  })}
            </ul> 
        </div>
    )
  }
  componentDidMount() {
    missingPetsDbRef.on('value', (snapshot) => {
    const petData = snapshot.val();
    const missingPets = [];
    for (let pet in petData) {
      missingPets.push(petData[pet]);
    }
      this.setState({
        missingPets
      });
     
    });
  }
}

class App extends React.Component {
  constructor() {
    super();
    this.state = {
    //app original state
      loggedIn: false,
      user: null
        }
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    }
    //set login method
    login () {
        auth.signInWithPopup(provider)
        .then( (result) => {
            const user = result.user;
            this.setState({
                user: user,
                loggedIn: true
            })
        });
    }
    //set logout method
    logout () {
        auth.signOut()
        .then( () => {
            this.setState({
                    user: null,
                    loggedIn: false
            })
        });
    }
  render () { 
    return (
      <Router>
          <div>
              <header className='top-header wrapper'>    
                  <h1 className="top-header__title wrapper">PawPrints<img className="top-header__logoImage" src="../../assets/noun_987404_cc (1).png"/></h1>
                  <nav className="top-header__navMain wrapper">
                      <Link to="/"><button>Home</button></Link>
                      <Link to="/missing-pets"><button>Missing Pets</button></Link>
                      <Link to="/about"><button>About Us</button></Link>
                      {this.state.loggedIn ?
                        <div>
                        <Link to="/profile"><button>Profile</button></Link>
                        <button onClick={this.logout}>Log Out</button>
                        </div>
                        :
                        <button onClick={this.login}>Log In</button>
                      }
                  </nav>
              </header>
              <Route exact path="/" component={Home} />
              <Route path="/missing-pets" component={MissingPets} />
              <Route path="/profile" component={Profile} />
              <Route path="/about" component={About} />
          </div>
      </Router>
    )
  }
  //on authstate change
  //keeps logged in after 
  componentDidMount () {
    auth.onAuthStateChanged ( (user) => {
        if (user) {
            this.setState({
                user: user,
                loggedIn: true
            });
            const userId = user.uid;
            const userRef = firebase.database().ref();
        }
    });
  }
}

// simon: fix this for me later (from simon)
// App.propTypes = {
//     history: React.PropTypes.shape({
//         push: React.PropTypes.func.isRequired
//     }).isRequired
// }




ReactDOM.render(<App />, document.getElementById('app'));