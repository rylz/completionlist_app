import React, {Component} from 'react';
import {createStackNavigator, createAppContainer} from 'react-navigation';
import { Dimensions, ScrollView, StyleSheet, Text, UIManager, View } from 'react-native';
import { Table, TableWrapper, Row, Rows, Col, Cols, Cell } from 'react-native-table-component';
import { CheckBox } from 'react-native-elements';
import { Font } from 'expo';
import moment from 'moment'

const WIDTH = Dimensions.get('window').width
const HEIGHT = Dimensions.get('window').height

const HOST = 'https://completionlist.herokuapp.com'

// changing moment.js default print values to shorthand
moment.updateLocale('en', {
    relativeTime : {
        s:  '%d s',
        m:  '1 m',
        mm: '%d m',
        h:  '1 h',
        hh: '%d h',
        d:  '1 d',
        dd: '%d d',
        ww: '%d w',
        M:  '4 w',
        MM: function(num) {
                return num * 4 + ' w' // months to weeks
            },
        YY: '%d y',
    }
});

class HomeScreen extends React.Component {
    state = {isLoading: true,
             lists: [],
             uid: null}

    componentDidMount() {
        Font.loadAsync({
            FontAwesome: require('./assets/fa-regular-400.ttf'),
        });
        return fetch( HOST + '/')
            .then( (response) => response.json())
            .then( (responseJson) => {
                this.setState({
                    isLoading: false,
                    lists: responseJson.lists,
                    user: responseJson.user,
                })
            } )
            .catch( (error) => {
                console.error(error);
            });
    }

    render() {
        if (this.state.isLoading) {
          return (
            <View style={ {flex: 1, padding: 20, backgroundColor: 'lightcyan'} }>
            </View>
          )
        }
        const {navigate} = this.props.navigation;

        // lists sorted in descending order of date
        const sortedLists = this.state.lists.sort( (a,b) => {
            return b.creation_time - a.creation_time
        });

        const user = this.state.user;

        return (
              <ScrollView style={styles.homeContainer}>
                  <Table borderStyle = { styles.homeTable }>
                      <Row  data={ ['Your Lists'] } style={styles.head} textStyle={styles.headtext}/>
                      {sortedLists.map( (list, i) => {
                         return (
                             <Row
                                 key={i}
                                 data={[list.name, moment.unix(list.creation_time).fromNow()]}
                                 textStyle={styles.text}
                                 flexArr={[2, 1]}
                                 onPress = { () => {
                                     fetch( HOST + '/list/' + list.template_id + "/" + user.uid )
                                        .then( (response) => response.json())
                                        .then( (responseJson) => {
                                             navigate('ListInstance', {user: user, list: list, items: responseJson.items, otherUsers: responseJson.users} )
                                        } )
                                        .catch( (error) => {
                                            console.error(error);
                                        });
                                     }
                                 } />
                         );
                      } ) }
                  </Table>
            </ScrollView>
        );
    }
}

class ListInstanceScreen extends React.Component {
    state = {items: [],
             users: []}

    render() {
        const {navigate} = this.props.navigation;
        const info = this.props.navigation.state.params;

        const listTitle = "@" + info.user.username + "'s " + info.list.name + " List";

        return (
            <ScrollView style={styles.homeContainer}>

                <Table borderStyle = { {borderWidth: 1, borderColor: 'mediumturquoise'}}>
                      <Row data ={[listTitle]} style={styles.head} textStyle={styles.headtext}/>
                      {info.items.map( (item, i) => {
                            return (
                                <Row 
                                    key={i}
                                    data={[
                                        <CheckBox
                                            checkedIcon='check-square'
                                            uncheckedIcon='square'
                                            title={item.name}
                                            checked={item.checked}
                                        />]}
                                    textStyle={styles.text}
                                    flexArr={[1]}
                                />
                            );
                          }
                      )}
                </Table>

                <Table borderStyle = { {borderWidth: 1, borderColor: 'mediumturquoise'}}>
                      <Row data ={['Other Users With This List']} style={styles.head} textStyle={styles.headtext}/>
                      {info.otherUsers.map( (otherUser, i) => {
                            return (
                             <Row
                                 key={i}
                                 data={[otherUser.username, moment.unix(info.list.creation_time).fromNow()]}
                                 textStyle={styles.text}
                                 flexArr={[2, 1]}
                                 onPress = { () => {
                                     fetch( HOST + '/list/' + info.list.template_id + "/" + otherUser.uid )
                                        .then( (response) => response.json())
                                        .then( (responseJson) => {
                                             navigate('ListInstance', {user: otherUser, list: info.list, items: responseJson.items, otherUsers: responseJson.users} )
                                        } )
                                        .catch( (error) => {
                                            console.error(error);
                                        });
                                     }
                                 }
                                />
                            );
                          }
                    )}
                </Table>
            
                {/* TODO remove this manual padding */}
                <Text>{"\n\n\n\n"}</Text>
            </ScrollView>

        );
    }

};

const StackNavigator = createStackNavigator({
        Home: HomeScreen,
        ListInstance: ListInstanceScreen,
    },
    {
        initialRouteName: 'Home',
        defaultNavigationOptions: {
            header: null,
        }
    });

const StackContainer = createAppContainer(StackNavigator);

export default class App extends React.Component {
  render() {
    return <StackContainer />
  }
}

const styles = StyleSheet.create({
    detailContainer: {
        flex: 1,
        backgroundColor: 'lightcyan',
        paddingTop: 22,
    },
    head: {height: 40, backgroundColor: 'mediumturquoise'},
    headtext: {margin: 6, fontSize: 20, fontWeight: 'bold'},
    homeContainer: {
        flex: 1,
        backgroundColor: 'lightcyan',
        paddingTop: 22,
    },
    homeTable: {
        borderWidth: 2,
        borderColor: 'transparent',
    },
    text: {margin: 6, fontSize: 18},
});
