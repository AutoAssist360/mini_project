import Prisma from '../prisma/client.js';
import {hashPassword} from '../utils/hash.js';




export const register=async(req,res)=>{
    const {name,email,password}=req.body;
    if(!name || !email || !password){
        return res.status(400).json({message:'All fields are required'});
    }
    try{
        const existingUser=await Prisma.user.findUnique({where:{email}});
        if(existingUser){
            return res.status(400).json({message:'User already exists'});
        }
        password=await hashPassword(password);
        const newUser=await Prisma.user.create({
            data:{
                full_name: name,
                email:email,
                password_hash:password,
                 phone_number: req.body.phone_number || null,
                role: req.body.role || 'USER',
                
            }
        });
        res.status(201).json({message:'User created successfully',user:newUser});
    }catch(error){
        console.error(error);
        res.status(500).json({message:'Server error'});
    }
}
