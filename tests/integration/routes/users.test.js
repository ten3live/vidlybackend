const request = require('supertest');
const { User } = require('../../../models/user');

describe('/api/users', () => {
  let server;

  beforeEach(async () => { server = require('../../../index'); });
  afterEach(async () => {
    await server.close();
    await User.remove({});
  });

  describe('GET /me', () => {
    it('should return user me if authorized', async () => {
      const user = await User.create({
        "name": "Jeffery",
        "email": "jeff.schiers@concordiaplans.org",
        "password": "1234"
      });
      await user.save();

      const token = user.generateAuthToken();

      const res = await request(server)
        .get('/api/users/me')
        .set('x-auth-token', token)
        .send();

      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('email');
      expect(res.body).not.toHaveProperty('password');
    });
  });

  describe('POST /', () => {
    let name;
    let email;
    let password;

    const exec = () => {
      return request(server)
        .post('/api/users')
        .send({ name, email, password });
    };

    beforeEach(async () => {
      name = '12345';         //min 5, max 50, required
      email = 'me@email.com'; //min 5, max 255, email
      password = '12345';     //min 5, max 255, required
    });

    describe('should return 400', () => {
      it('if user name less than 5 chars', async () => {
        name = '1234';
        const res = await exec();
        expect(res.status).toBe(400);
      });

      it('if user name more than 50 chars', async () => {
        name = new Array(52).join('a');
        const res = await exec();
        expect(res.status).toBe(400);
      });

      it('if user email less than 5 chars', async () => {
        email = '1234';
        const res = await exec();
        expect(res.status).toBe(400);
      });

      it('if user email more than 255 chars', async () => {
        email += new Array(255).join('a');
        const res = await exec();
        expect(res.status).toBe(400);
      });

      it('if user email is not a valid email', async () => {
        email = '12345';
        const res = await exec();
        expect(res.status).toBe(400);
      });

      it('if user password less than 5 chars', async () => {
        password = '1234';
        const res = await exec();
        expect(res.status).toBe(400);
      });

      it('if user password more than 255 chars', async () => {
        password = new Array(257).join('a');
        const res = await exec();
        expect(res.status).toBe(400);
      });

      it('if user already registered', async () => {
        await exec();
        const res = await exec();
        expect(res.status).toBe(400);
      });
    });

    it('should save the user if it is valid', async () => {
      await exec();
      const user = await User.find({ name, email });
      expect(email).not.toBeNull();
    });
    
    it('should return the user if it is valid', async () => {
      const res = await exec();
      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('name', name);
      expect(res.body).toHaveProperty('email', email);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return token in header if user is valid', async () => {
      const res = await exec();
      expect(res.header).toHaveProperty('x-auth-token');
    });
  });
});