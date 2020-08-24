const { db } = require("./connection");
//Estructura de resolvedores

//Structure of dates
const pizzaResolver = {
  Query: {
    pizzas(root, args) {
      const isObjectEmpty = Object.entries(args).length == 0;
      if (isObjectEmpty) {
        return db.any("SELECT * FROM pizza ORDER BY id DESC");
      } else {
        return db.any("SELECT * FROM pizza WHERE id=$1", [args.id]);
      }
    },
    ingredients(root, args) {
      const isObjectEmpty = Object.entries(args).length == 0;
      if (isObjectEmpty) {
        return db.any("SELECT * FROM ingredient");
      } else {
        return db.any("SELECT * FROM ingredient WHERE id=$1", [args.id]);
      }
    },
  },
  Pizza: {
    ingredients(pizza) {
      console.log("Entre al método de ingredients");
      console.log(pizza);
      return db.any(
        `SELECT ingredient.* FROM pizza_ingredients,
        ingredient WHERE pizza_ingredients.ingredient_id=ingredient.id and 
        pizza_ingredients.pizza_id=$1;`,
        pizza.id
      );
    },
  },
  Mutation: {
    async createPizza(root, { pizza }) {
      if (pizza === undefined) {
        return null;
      }
      console.log(pizza);
      const query = `INSERT INTO public.pizza(name, origin) VALUES ($1, $2) returning *`;
      let result = await db.one(query, [pizza.name, pizza.origin]);
      console.log(result);
      if (pizza.ingredientIds && pizza.ingredientIds.length > 0) {
        const query1 = `INSERT INTO pizza_ingredients(pizza_id, ingredient_id) VALUES ($1, $2) 
        returning *`;

        for (const ingredientID of pizza.ingredientIds) {
          await db.one(query1, [result.id, ingredientID]);
        }
      }

      return await db.any("SELECT * FROM pizza ORDER BY id DESC");;
    },
    async updatePizza(root, args) {
      const query = `UPDATE pizza SET name=$1, origin=$2 where id=$3 returning *;`;
      const pizza = args.pizzaU;
      console.log(pizza.ingredientIds);
      let result = await db.one(query, [pizza.name, pizza.origin, args.idLast]);
      if (pizza.ingredientIds && pizza.ingredientIds.length > 0) {
        const query = `INSERT INTO pizza_ingredients(pizza_id, ingredient_id) VALUES ($1, $2) 
          returning *`;
        for (const ingredientID of pizza.ingredientIds) {
          await db.one(query, [result.id, ingredientID]);
        }
      }
      return result;
    },

    async deletePizza(root, { id }) {
      const query = `DELETE FROM pizza WHERE id=$1;`;
      const query2 = `DELETE FROM pizza_ingredients WHERE pizza_id = $1;`
      const query3 = `SELECT * FROM pizza ORDER BY id DESC;`
      await db.none(query2, id);
      await db.none(query, id);
      let result = await db.any(query3);
      return result;
    }
  },
};

export default pizzaResolver;
