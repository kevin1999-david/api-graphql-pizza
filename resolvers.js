const { db } = require("./connection");

const pizzaResolver = {
    Query: {
        async pizzas(root, args) {
            const isObjectEmpty = Object.entries(args).length == 0;
            if (isObjectEmpty) {
                return await db.any("SELECT * FROM pizza ORDER BY id DESC");
            } else {
                return await db.any("SELECT * FROM pizza WHERE id=$1", [args.id]);
            }
        },
        async ingredients(root, args) {
            const isObjectEmpty = Object.entries(args).length == 0;
            if (isObjectEmpty) {
                return await db.any("SELECT * FROM ingredient ORDER BY id DESC");
            } else {
                return await db.any("SELECT * FROM ingredient WHERE id=$1", [args.id]);
            }
        },
        async pizzaIngredients(root, { id }) {
            const query = `SELECT i.id , i.name, i.calories FROM 
      pizza_ingredients pi inner join ingredient i
      on pi.ingredient_id = i.id where pi.pizza_id = $1 order by i.id ;`;
            return await db.any(query, id);
        }
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

            let result = await db.one(query, [pizza.name, pizza.origin, args.idLast]);
            // if (pizza.ingredientIds && pizza.ingredientIds.length > 0) {
            //   const query = `INSERT INTO pizza_ingredients(pizza_id, ingredient_id) VALUES ($1, $2) 
            //     returning *`;
            //   for (const ingredientID of pizza.ingredientIds) {
            //     await db.one(query, [result.id, ingredientID]);
            //   }
            // }

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
        },
        async createIngredient(root, { ingredient }) {
            const query = `INSERT INTO ingredient (name , calories ) VALUES($1, $2);`;
            await db.none(query, [ingredient.name, ingredient.calories]);
            return await db.any("SELECT * FROM ingredient ORDER BY id DESC");
        },
        async updateIngredient(root, args) {
            const ingredient = args.ingredientU;
            const query = `UPDATE ingredient SET name=$1, calories=$2 WHERE id=$3;`;
            await db.none(query, [ingredient.name, ingredient.calories, args.idLast]);
            return await db.any("SELECT * FROM ingredient ORDER BY id DESC");
        },
        async deleteIngredient(root, { id }) {
            const query = `DELETE FROM ingredient WHERE id = $1`;
            const query2 = `DELETE FROM pizza_ingredients WHERE ingredient_id = $1;`
            await db.none(query2, id);
            await db.none(query, id);
            return await db.any("SELECT * FROM ingredient ORDER BY id DESC");
        },
        async createPizzaIngredient(root, { idPizza, nameIngredient }) {
            const query = `INSERT INTO pizza_ingredients (pizza_id, ingredient_id) 
                      VALUES($1,$2);`;
            const query2 = `SELECT id FROM ingredient WHERE name = $1;`;
            const query3 = `SELECT * FROM pizza_ingredients WHERE 
                      pizza_id = $1 and ingredient_id = $2;`;
            const query4 = `SELECT i.id , i.name, i.calories FROM 
                    pizza_ingredients pi inner join ingredient i
                    on pi.ingredient_id = i.id where pi.pizza_id = $1 order by i.id ;`;
            const { id } = await db.one(query2, nameIngredient);
            const findRecord = await db.oneOrNone(query3, [idPizza, id]);

            if (!findRecord) {
                await db.none(query, [idPizza, id]);
                return await db.any(query4, idPizza);
            } else {
                return await db.any(query4, idPizza);
            }

        },
        async deletePizzaIngredient(root, { idPizza, idIngredient }) {
            const query = `DELETE FROM pizza_ingredients WHERE pizza_id = $1 AND ingredient_id = $2;`;
            const query2 = `SELECT i.id , i.name, i.calories FROM 
          pizza_ingredients pi inner join ingredient i
          on pi.ingredient_id = i.id where pi.pizza_id = $1 order by i.id ;`;
            await db.none(query, [idPizza, idIngredient]);
            return await db.any(query2, idPizza);
        }
    },

};

export default pizzaResolver;