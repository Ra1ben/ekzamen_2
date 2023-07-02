import { faker } from '@faker-js/faker';

describe('API tests', () => {

  let user;
  let accessToken;
  
  before(() => {
    user = {
      email: faker.internet.email(),
      password: faker.internet.password()
    };
  });

  it('Register a new user', () => {
    cy.request('POST', '/register', user).then((response) => {
      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('accessToken');
      accessToken = response.body.accessToken; 
      cy.writeFile('cypress/fixtures/Token.json', {token: accessToken});
    });
  });
  
  it('1. Get all posts, status code 200', () => {
    cy.log('all posts');
  
    cy.request('GET', '/posts').then((response) => {
      expect(response.status).to.equal(200);
      expect(response.headers['content-type']).to.include('application/json');
    });
  });

  it('2. Verify HTTP response status code 200', () => {
    const limit = 10;
    const page = 1;
  
    cy.log('Get first 10 posts');
    cy.request('GET', `/posts?_page=${page}&_limit=${limit}`).then(response => {
      expect(response.status).to.be.equal(200);
      expect(response.body).to.have.lengthOf(limit);
    });
  });
  
  it('3. Get posts with id = 55 and id = 60. Verify HTTP response status code 200', () => {
    const expectedId = [55, 60];
  
    cy.request('GET', `/posts?id=55&id=60`).then(response => {
      expect(response.status).to.be.equal(200);
  
      const returnedPosts = response.body;
      const returnedId = returnedPosts.map(post => post.id);
  
      if (returnedId.length > 0) {
        expect(returnedId).to.include.members(expectedId);
      } else {
        cy.log('There are no posts with the required ID.');
      }
    });
  });

  it('4. Create a post. Verify HTTP response status code 401', () => {
    let post = {
      id: faker.number.int(),
      title: faker.person.jobArea(),
      author: faker.internet.userName()
    };
    cy.request({
      method: 'POST',
      url: '/664/posts',
      body: post,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.equal(401);
     });
  });

  it('5. Create post with adding access token in header. Verify HTTP response status code 201', () => {
    cy.readFile('cypress/fixtures/Token.json').then((fileContents) => {
      const {token} = fileContents;
  
      let post = {
        id: faker.number.int(),
        title: faker.person.jobArea(),
        author: faker.internet.userName()
      };
  
      cy.request({
        method: 'POST',
        url: '/664/posts',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: post
      }).then((response) => {
        expect(response.status).to.equal(201);
        cy.log(response.status, {token});
  
        cy.request(`/posts/${post.id}`).then((getResponse) => {
          expect(getResponse.status).to.equal(200);
          cy.get(getResponse.body);
          cy.log('Post is created:', getResponse.body );
        });
      });
    });
  });

  it('6. Create post entity and verify that the entity is created. Verify HTTP response status code 201', () => {
    cy.readFile('cypress/fixtures/Token.json').then((fileContents) => {
      const { token } = fileContents;
  
      const newPost = {
        title: 'New Post',
        content: 'Some content to post',
        postDate: new Date().toISOString()
      };
  
      cy.request({
        method: 'POST',
        url: '/posts',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: newPost,
      }).then((response) => {
        expect(response.status).to.equal(201);
        expect(response.body).to.have.property('id');
        expect(response.body).to.have.property('title', newPost.title);
        expect(response.body).to.have.property('content', newPost.content);
        expect(response.body).to.have.property('postDate');
      });
    });
  });

  it('7. Update non-existing entity 404', () => {
    cy.readFile('cypress/fixtures/Token.json').then((fileContents) => {
      const { token } = fileContents;
  
      const postId = 'non-existing-post-id';
  
      const updatedPost = {
        title: 'Updated Post',
        content: 'Updated content',
        postDate: new Date().toISOString(),
      };
  
      cy.request({
        method: 'PUT',
        url: `/posts/${postId}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: updatedPost,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.equal(404);
      });
    });
  });

  it('8. Create post entity and update the created entity. Verify HTTP response status code and verify that the entity is updated. Status code 200', () => {
    cy.readFile('cypress/fixtures/Token.json').then((fileContents) => {
      const { token } = fileContents;
  
      const newPost = {
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraph(),
        postDate: new Date().toISOString()
      };

      cy.request({
        method: 'POST',
        url: '/posts',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: newPost,
      }).then((createResponse) => {
        expect(createResponse.status).to.equal(201);
        expect(createResponse.body).to.have.property('id');
  
        const postId = createResponse.body.id;
  
        cy.request({
          method: 'GET',
          url: `/posts/${postId}`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((getResponse) => {
          expect(getResponse.status).to.equal(200);
          expect(getResponse.body).to.have.property('id', postId);
          expect(getResponse.body).to.have.property('title', newPost.title);
          expect(getResponse.body).to.have.property('content', newPost.content);
          expect(getResponse.body).to.have.property('postDate', newPost.postDate);
  
          const updatedPost = {
            title: faker.lorem.sentence(),
            content: faker.lorem.paragraph(),
            postDate: new Date().toISOString()
          };
  
          cy.request({
            method: 'PUT',
            url: `/posts/${postId}`,
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: updatedPost,
          }).then((updateResponse) => {
            expect(updateResponse.status).to.equal(200);
            expect(updateResponse.body).to.have.property('id', postId);
            expect(updateResponse.body).to.have.property('title', updatedPost.title);
            expect(updateResponse.body).to.have.property('content', updatedPost.content);
            expect(updateResponse.body).to.have.property('postDate', updatedPost.postDate);
  
            cy.request({
              method: 'GET',
              url: `/posts/${postId}`,
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }).then((getUpdatedResponse) => {
              expect(getUpdatedResponse.status).to.equal(200);
              expect(getUpdatedResponse.body).to.have.property('id', postId);
              expect(getUpdatedResponse.body).to.have.property('title', updatedPost.title);
              expect(getUpdatedResponse.body).to.have.property('content', updatedPost.content);
              expect(getUpdatedResponse.body).to.have.property('postDate', updatedPost.postDate);
            });
          });
        });
      });
    });
  });

  it('9. Delete non-existing post entity. Verify HTTP response status code 404.', () => {
    cy.readFile('cypress/fixtures/Token.json').then((fileContents) => {
      const { token } = fileContents;
  
      const nonExistingPostId = 'non-existing-id';
  
      cy.request({
        method: 'DELETE',
        url: `/posts/${nonExistingPostId}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.equal(404);
      });
    });
  });

  it('10. Create post entity, update the created entity, and delete the entity. Verify HTTP response status code and verify that the entity is deleted. Status code 200', () => {
    cy.readFile('cypress/fixtures/Token.json').then((fileContents) => {
      const { token } = fileContents;
  
      const newPost = {
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraph()
      };
  
      cy.request({
        method: 'POST',
        url: '/posts',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: newPost,
      }).then((createResponse) => {
        expect(createResponse.status).to.equal(201);
        expect(createResponse.body).to.have.property('id');
  
        const postId = createResponse.body.id;

        const updatedPost = {
          title: faker.lorem.sentence(),
          content: faker.lorem.paragraph()
        };
  
        cy.request({
          method: 'PUT',
          url: `/posts/${postId}`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: updatedPost,
        }).then((updateResponse) => {
          expect(updateResponse.status).to.equal(200);
          expect(updateResponse.body).to.have.property('id', postId);
          expect(updateResponse.body).to.have.property('title', updatedPost.title);
          expect(updateResponse.body).to.have.property('content', updatedPost.content);
  
          cy.request({
            method: 'DELETE',
            url: `/posts/${postId}`,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }).then((deleteResponse) => {
            expect(deleteResponse.status).to.equal(200);

            cy.request({
              method: 'GET',
              url: `/posts/${postId}`,
              failOnStatusCode: false,
            }).then((getResponse) => {
              expect(getResponse.status).to.equal(404);
            });
          });
        });
      });
    });
  });
  
  
  

  
  
  
  
  
  
  
  
  
  
  
  
  
  

  
})